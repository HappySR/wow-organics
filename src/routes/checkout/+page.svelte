<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { requireAuth } from '$lib/utils/guards';
  import { supabase } from '$lib/utils/supabase';
  import { createRazorpayOrder, initiatePayment, verifyPayment } from '$lib/utils/razorpay';
  import { formatCurrency } from '$lib/utils/helpers';
  import type { Address } from '$lib/types';
  import { getSettings } from '$lib/utils/settings';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { formatDate } from '$lib/utils/helpers';

  let authChecking = $state(true);
  let addresses = $state<Address[]>([]);
  let selectedAddress = $state<Address | null>(null);
  let paymentMethod = $state<'online' | 'cod'>('online');
  let loading = $state(false);
  let showAddressForm = $state(false);

  let newAddress = $state({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false
  });

  let paymentSettings = $state({
    razorpay_enabled: true,
    cod_enabled: true
  });

  onMount(async () => {
    const canAccess = await requireAuth();
    authChecking = false;
    const settings = await getSettings();
    
    if (!canAccess) {
      goto('/auth/login');
      return;
    }
    
    if (cart.items.length === 0) {
      goto('/cart');
      return;
    }

    paymentSettings = {
      razorpay_enabled: settings.razorpay_enabled,
      cod_enabled: settings.cod_enabled
    };

    await loadAddresses();
  });

  async function loadAddresses() {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', auth.user!.id)
      .order('is_default', { ascending: false });
    
    if (data) {
      addresses = data;
      selectedAddress = data.find(a => a.is_default) || data[0] || null;
    }
  }

  async function saveAddress() {
    if (!auth.user) return;

    loading = true;
    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: auth.user.id,
          ...newAddress
        })
        .select()
        .single();

      if (error) throw error;

      addresses = [...addresses, data];
      selectedAddress = data;
      showAddressForm = false;
      toast.success('Address added successfully');
      
      // Reset form
      newAddress = {
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
      };
    } catch (error) {
      toast.error('Failed to save address');
    } finally {
      loading = false;
    }
  }

  async function placeOrder() {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    if (!auth.user) {
      toast.error('Please log in to continue');
      return;
    }

    loading = true;
    
    try {
      // Validate cart items
      if (cart.items.length === 0) {
        toast.error('Your cart is empty');
        loading = false;
        return;
      }

      // 1. Prepare the order items for the RPC call
      const orderItemsPayload = cart.items.map(item => {
        if (!item.product) {
          throw new Error('Invalid cart item: missing product');
        }
        const unitPrice = item.product.base_price + (item.variant?.price_modifier || 0);
        const gstAmount = (unitPrice * item.product.gst_percentage) / 100;
        const totalPrice = unitPrice * item.quantity;

        return {
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          product_name: item.product.name,
          variant_name: item.variant 
            ? `${item.variant.variant_name}: ${item.variant.variant_value}` 
            : null,
          quantity: item.quantity,
          unit_price: unitPrice,
          gst_amount: gstAmount,
          total_price: totalPrice
        };
      });

      console.log('Creating order with items:', orderItemsPayload);

      // 2. Call the database function
      const { data: newOrderData, error: rpcError } = await supabase
        .rpc('create_order_with_items', {
          p_user_id: auth.user.id,
          p_address_id: selectedAddress.id,
          p_subtotal: cart.subtotal,
          p_gst_amount: cart.gstAmount,
          p_transport_charges: cart.transportCharges,
          p_total_amount: cart.total,
          p_payment_method: paymentMethod,
          p_items: orderItemsPayload
        })
        .single();
      
      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to create order. Please try again.');
      }

      // Type assertion - order ID is returned as string
      const typedOrderData = newOrderData as { 
        created_order_id: string; 
        created_order_number: string;
        delivery_date: string;
      };
      
      const order = {
        id: typedOrderData.created_order_id,
        order_number: typedOrderData.created_order_number,
        delivery_date: typedOrderData.delivery_date
      };
      
      console.log('Order created via RPC:', order);

      // 3. Continue with the payment logic
      if (paymentMethod === 'online') {
        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder(cart.total);
        console.log('Razorpay order created:', razorpayOrder);

        // Update order with Razorpay order ID
        await supabase
          .from('orders')
          .update({ razorpay_order_id: razorpayOrder.id })
          .eq('id', order.id);

        // Initiate payment
        await initiatePayment({
          amount: cart.total,
          currency: 'INR',
          orderId: razorpayOrder.id,
          name: auth.profile?.full_name || selectedAddress.full_name,
          email: auth.user.email || '',
          phone: selectedAddress.phone,
          description: `Order #${order.order_number}`,
      
          onSuccess: async (response) => {
            console.log('Payment successful:', response);
            
            try {
              // Verify payment on server
              const verificationResult = await verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verificationResult.success) {
                // Update payment status
                const { error: updateError } = await supabase
                  .from('orders')
                  .update({
                    payment_status: 'paid',
                    razorpay_payment_id: response.razorpay_payment_id,
                    order_status: 'confirmed'
                  })
                  .eq('id', order.id);
                  
                if (updateError) {
                  console.error('Failed to update order status:', updateError);
                }

                // Clear cart
                await cart.clearCart(auth.user!.id);
                
                // Send order email
                await sendOrderEmail(order.id);
                
                // Show success message with delivery date
                const deliveryDate = new Date(order.delivery_date);
                toast.success(`Order confirmed! Delivery by ${deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
                
                goto(`/orders/${order.id}`);
              } else {
                throw new Error('Payment verification failed');
              }
            } catch (verifyError) {
              console.error('Payment verification error:', verifyError);
              await supabase
                .from('orders')
                .update({ payment_status: 'failed' })
                .eq('id', order.id);
              toast.error('Payment verification failed. Please contact support.');
              loading = false;
            }
          },
          onFailure: async (error) => {
            console.error('Payment failed:', error);
            await supabase
              .from('orders')
              .update({ payment_status: 'failed' })
              .eq('id', order.id);
            toast.error(error.description || 'Payment failed. Please try again.');
            loading = false;
          }
        });
      } else {
        // COD order - mark as confirmed immediately
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            order_status: 'confirmed',
            payment_status: 'pending'
          })
          .eq('id', order.id);

        if (updateError) {
          console.error('Failed to update order status:', updateError);
          throw new Error('Failed to confirm order');
        }

        // Clear cart
        await cart.clearCart(auth.user.id);
        
        // Send order email
        await sendOrderEmail(order.id);
        
        // Show success message with delivery date
        const deliveryDate = new Date(order.delivery_date);
        toast.success(`Order placed! Delivery by ${deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
        
        goto(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
      loading = false;
    }
  }

  async function sendOrderEmail(orderId: string) {
    try {
      // Add a small delay to ensure the order is fully committed to the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch('/api/send-order-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Email send failed:', errorData);
      } else {
        const result = await response.json();
        console.log('Email sent successfully:', result);
      }
    } catch (error) {
      console.error('Failed to send order email:', error);
      // Don't throw - email failure shouldn't stop the order process
    }
  }
</script>

<svelte:head>
  <title>Checkout - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Checkout Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Delivery Address -->
        <Card>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
          
          {#if addresses.length > 0 && !showAddressForm}
            <div class="space-y-3">
              {#each addresses as address}
                <button
                  onclick={() => selectedAddress = address}
                  class={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedAddress?.id === address.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p class="font-semibold text-gray-900">{address.full_name}</p>
                  <p class="text-sm text-gray-600">{address.phone}</p>
                  <p class="text-sm text-gray-600 mt-1">
                    {address.address_line1}, {address.address_line2 || ''}
                  </p>
                  <p class="text-sm text-gray-600">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                </button>
              {/each}
            </div>

            <Button
              variant="outline"
              fullWidth
              class="mt-4"
              onclick={() => showAddressForm = true}
            >
              Add New Address
            </Button>
          {:else}
            <div class="space-y-4">
              <Input
                label="Full Name"
                bind:value={newAddress.full_name}
                required
              />
              <Input
                label="Phone"
                type="tel"
                bind:value={newAddress.phone}
                required
              />
              <Input
                label="Address Line 1"
                bind:value={newAddress.address_line1}
                required
              />
              <Input
                label="Address Line 2"
                bind:value={newAddress.address_line2}
              />
              <div class="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  bind:value={newAddress.city}
                  required
                />
                <Input
                  label="State"
                  bind:value={newAddress.state}
                  required
                />
              </div>
              <Input
                label="Pincode"
                bind:value={newAddress.pincode}
                required
              />

              <div class="flex space-x-3">
                <Button onclick={saveAddress} loading={loading}>
                  Save Address
                </Button>
                {#if addresses.length > 0}
                  <Button
                    variant="outline"
                    onclick={() => showAddressForm = false}
                  >
                    Cancel
                  </Button>
                {/if}
              </div>
            </div>
          {/if}
        </Card>

        <!-- Payment Method -->
        <Card>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
          
          <div class="space-y-3">
            {#if paymentSettings.razorpay_enabled}
            <button
              onclick={() => paymentMethod = 'online'}
              class={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                paymentMethod === 'online'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p class="font-semibold text-gray-900">Online Payment</p>
              <p class="text-sm text-gray-600">Pay securely using Razorpay</p>
            </button>
            {/if}
  
            {#if paymentSettings.cod_enabled}
            <button
              onclick={() => paymentMethod = 'cod'}
              class={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                paymentMethod === 'cod'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p class="font-semibold text-gray-900">Cash on Delivery</p>
              <p class="text-sm text-gray-600">Pay when you receive</p>
            </button>
            {/if}
  
            {#if !paymentSettings.razorpay_enabled && !paymentSettings.cod_enabled}
              <p class="text-red-600">No payment methods available. Please contact support.</p>
            {/if}
          </div>
        </Card>
      </div>

      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <Card class="sticky top-24">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div class="space-y-2 mb-4">
            {#each cart.items as item}
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">
                  {item.product?.name} × {item.quantity}
                </span>
                <span class="text-gray-900">
                  {formatCurrency((item.product!.base_price + (item.variant?.price_modifier || 0)) * item.quantity)}
                </span>
              </div>
            {/each}
          </div>

          <div class="border-t border-gray-200 pt-4 space-y-3 mb-6">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            
            <div class="flex justify-between text-gray-600">
              <span>GST</span>
              <span>{formatCurrency(cart.gstAmount)}</span>
            </div>
            
            <div class="flex justify-between text-gray-600">
              <span>Transport</span>
              <span>{formatCurrency(cart.transportCharges)}</span>
            </div>
            
            <div class="border-t border-gray-200 pt-3">
              <div class="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onclick={placeOrder}
            loading={loading}
            disabled={!selectedAddress}
          >
            Place Order
          </Button>
        </Card>
      </div>
    </div>
  </div>
</div>
