<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { requireAuth } from '$lib/utils/guards';
  import { formatCurrency, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '$lib/utils/helpers';
  import type { Order } from '$lib/types';
  import { toast } from '$lib/stores/toast.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Package, ChevronRight } from 'lucide-svelte';

  let orders = $state<Order[]>([]);
  let loading = $state(true);
  let authChecking = $state(true);

  onMount(async () => {
    const canAccess = await requireAuth();
    authChecking = false;
    
    if (canAccess) {
      await loadOrders();
    }
  });

  async function loadOrders() {
    if (!auth.user?.id) {
      console.log('No user ID available');
      loading = false;
      return;
    }
    
    loading = true;
    try {
      console.log('Loading orders for user:', auth.user.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
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
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading orders:', error);
        toast.error('Failed to load orders');
        orders = [];
      } else {
        console.log(`Loaded ${data?.length || 0} orders`);
        orders = data || [];
        
        // Log if any orders have missing data
        orders.forEach(order => {
          if (!order.items || order.items.length === 0) {
            console.warn('Order has no items:', order.order_number);
          }
          if (!order.address) {
            console.warn('Order has no address:', order.order_number);
          }
        });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('An unexpected error occurred');
      orders = [];
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>My Orders - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

    {#if loading}
      <div class="space-y-4">
        {#each Array(3) as _}
          <Card>
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        {/each}
      </div>
    {:else if orders.length === 0}
      <Card>
        <div class="text-center py-12">
          <Package size={64} class="mx-auto text-gray-400 mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p class="text-gray-600 mb-6">Start shopping to see your orders here</p>
          <button
            onclick={() => goto('/products')}
            class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </Card>
    {:else}
      <div class="space-y-4">
        {#each orders as order}
          <Card hover>
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center flex-wrap gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">
                    Order #{order.order_number}
                  </h3>
                  <span class={`px-3 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(order.order_status)}`}>
                    {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                  </span>
                  <span class={`px-3 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </span>
                </div>

                <p class="text-sm text-gray-600 mb-1">
                  Placed on {formatDateTime(order.created_at)}
                </p>

                <p class="text-sm text-gray-600 mb-2">
                  {order.items?.length || 0} item(s) • {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                </p>

                {#if order.address}
                  <p class="text-sm text-gray-600">
                    Delivering to: {order.address.city}, {order.address.state}
                  </p>
                {/if}
              </div>

              <div class="flex items-center space-x-4">
                <div class="text-right">
                  <p class="text-sm text-gray-600">Total Amount</p>
                  <p class="text-2xl font-bold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>

                <button
                  onclick={() => goto(`/orders/${order.id}`)}
                  class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="View order details"
                >
                  <ChevronRight size={24} class="text-gray-600" />
                </button>
              </div>
            </div>

            <!-- Order Items Preview -->
            {#if order.items && order.items.length > 0}
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex flex-wrap gap-2">
                  {#each order.items.slice(0, 3) as item}
                    <div class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {item.product_name} × {item.quantity}
                    </div>
                  {/each}
                  {#if order.items.length > 3}
                    <div class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      +{order.items.length - 3} more
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</div>
