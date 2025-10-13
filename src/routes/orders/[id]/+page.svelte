<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { formatCurrency, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '$lib/utils/helpers';
  import type { Order } from '$lib/types';
  import { toast } from '$lib/stores/toast.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Package, MapPin, CreditCard, Calendar } from 'lucide-svelte';

  let order = $state<Order | null>(null);
  let loading = $state(true);

  onMount(async () => {
    // Check auth only in browser
    if (!auth.isAuthenticated) {
      goto('/auth/login');
      return;
    }
    await loadOrder();
  });

  async function loadOrder() {
    if (!auth.user?.id) {
      console.log('No user ID available');
      loading = false;
      return;
    }
    
    loading = true;
    try {
      const orderId = $page.params.id;
      console.log('Loading order:', orderId);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            product_id,
            variant_id,
            product_name,
            variant_name,
            quantity,
            unit_price,
            total_price,
            gst_amount
          ),
          address:addresses(
            full_name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            pincode
          )
        `)
        .eq('id', orderId)
        .eq('user_id', auth.user.id)
        .single();

      if (error) {
        console.error('Error loading order:', error);
        
        // Check if order exists but doesn't belong to user
        if (error.code === 'PGRST116') {
          toast.error('Order not found or access denied');
        } else {
          toast.error('Failed to load order details');
        }
        
        order = null;
      } else {
        console.log('Order loaded successfully:', data);
        order = data;
        
        // Validate that we have items
        if (!data.items || data.items.length === 0) {
          console.warn('Order has no items');
        }
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('An unexpected error occurred');
      order = null;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Order #{order?.order_number || ''} - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if loading}
      <Card>
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div class="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    {:else if !order}
      <Card>
        <div class="text-center py-12">
          <Package size={64} class="mx-auto text-gray-400 mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">Order not found</h2>
          <p class="text-gray-600 mb-6">This order doesn't exist or you don't have access to it</p>
          <Button onclick={() => goto('/orders')}>
            View All Orders
          </Button>
        </div>
      </Card>
    {:else}
      <!-- Order Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 class="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <div class="flex flex-wrap gap-2">
            <span class={`px-3 py-1 text-sm font-medium rounded-full ${getOrderStatusColor(order.order_status)}`}>
              {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
            </span>
            <span class={`px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
              {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
            </span>
          </div>
        </div>
        <p class="text-gray-600">
          <Calendar size={16} class="inline mr-1" />
          Placed on {formatDateTime(order.created_at)}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Order Items -->
        <div class="lg:col-span-2 space-y-4">
          <Card>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
            {#if order.items && order.items.length > 0}
              <div class="space-y-4">
                {#each order.items as item}
                  <div class="flex items-start space-x-4 py-4 border-b border-gray-200 last:border-0">
                    <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={32} class="text-gray-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-gray-900">{item.product_name}</h3>
                      {#if item.variant_name}
                        <p class="text-sm text-gray-600">{item.variant_name}</p>
                      {/if}
                      <p class="text-sm text-gray-600 mt-1">
                        Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                      {#if item.gst_amount > 0}
                        <p class="text-xs text-gray-500 mt-1">
                          (incl. GST: {formatCurrency(item.gst_amount * item.quantity)})
                        </p>
                      {/if}
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class="font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-600 py-4">No items found in this order</p>
            {/if}
          </Card>

          <!-- Delivery Address -->
          {#if order.address}
            <Card>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">
                <MapPin size={20} class="inline mr-2" />
                Delivery Address
              </h2>
              <div class="text-gray-700">
                <p class="font-semibold">{order.address.full_name}</p>
                <p>{order.address.phone}</p>
                <p class="mt-2">
                  {order.address.address_line1}
                  {#if order.address.address_line2}
                    <br />{order.address.address_line2}
                  {/if}
                </p>
                <p>
                  {order.address.city}, {order.address.state} - {order.address.pincode}
                </p>
              </div>
            </Card>
          {/if}

          <!-- Payment Info -->
          <Card>
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              <CreditCard size={20} class="inline mr-2" />
              Payment Information
            </h2>
            <div class="space-y-2 text-gray-700">
              <div class="flex justify-between">
                <span>Payment Method:</span>
                <span class="font-medium">
                  {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Payment Status:</span>
                <span class={`font-medium ${
                  order.payment_status === 'paid' ? 'text-green-600' :
                  order.payment_status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                </span>
              </div>
              {#if order.razorpay_payment_id}
                <div class="flex justify-between">
                  <span>Payment ID:</span>
                  <span class="font-mono text-sm">{order.razorpay_payment_id}</span>
                </div>
              {/if}
              {#if order.razorpay_order_id}
                <div class="flex justify-between">
                  <span>Order ID:</span>
                  <span class="font-mono text-sm">{order.razorpay_order_id}</span>
                </div>
              {/if}
            </div>
          </Card>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <Card class="sticky top-24">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div class="space-y-3">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              
              <div class="flex justify-between text-gray-600">
                <span>GST</span>
                <span>{formatCurrency(order.gst_amount)}</span>
              </div>
              
              <div class="flex justify-between text-gray-600">
                <span>Transport</span>
                <span>{formatCurrency(order.transport_charges)}</span>
              </div>
              
              <div class="border-t border-gray-200 pt-3">
                <div class="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span class="text-primary-600">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {#if order.notes}
              <div class="mt-6 pt-6 border-t border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <p class="text-sm text-gray-600">{order.notes}</p>
              </div>
            {/if}

            <div class="mt-6">
              <Button variant="outline" fullWidth onclick={() => goto('/orders')}>
                Back to Orders
              </Button>
            </div>
          </Card>
        </div>
      </div>
    {/if}
  </div>
</div>
