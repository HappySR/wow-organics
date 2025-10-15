<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency } from '$lib/utils/helpers';
  import { requireAdmin } from '$lib/utils/guards';
  import Card from '$lib/components/ui/Card.svelte';
  import { Eye, Search, Filter, Package, RefreshCw } from 'lucide-svelte';

  let orders = $state<any[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');
  let statusFilter = $state<string>('all');
  let showOrderModal = $state(false);
  let selectedOrder = $state<any>(null);

  onMount(async () => {
    const canAccess = await requireAdmin();
    if (canAccess) {
      await loadOrders();
    }
  });

  async function loadOrders() {
    loading = true;
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      orders = data || [];
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      loading = false;
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated successfully');
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  }

  async function updatePaymentStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Payment status updated successfully');
      await loadOrders();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment status');
    }
  }

  function openOrderDetails(order: any) {
    selectedOrder = order;
    showOrderModal = true;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      processing: 'bg-purple-50 text-purple-700 border-purple-200',
      shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const filteredOrders = $derived(
    orders.filter(order => 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<svelte:head>
  <title>Orders Management - Admin</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
        <Package class="text-primary-600" size={32} />
        Orders Management
      </h1>
      <p class="text-gray-600 mt-2">Manage and track all customer orders</p>
    </div>
    <button
      onclick={() => loadOrders()}
      class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:shadow-md hover:scale-105"
    >
      <RefreshCw size={18} />
      Refresh
    </button>
  </div>

  <!-- Filters -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card class="border-0 shadow-md">
      <div class="flex items-center space-x-3">
        <Search size={20} class="text-gray-400 flex-shrink-0" />
        <input
          bind:value={searchQuery}
          placeholder="Search by order number, customer name, or email..."
          class="flex-1 border-0 focus:ring-0 bg-transparent text-gray-900 placeholder-gray-500"
        />
      </div>
    </Card>

    <Card class="border-0 shadow-md">
      <div class="flex items-center space-x-3">
        <Filter size={20} class="text-gray-400 flex-shrink-0" />
        <select
          bind:value={statusFilter}
          onchange={() => loadOrders()}
          class="flex-1 border-0 focus:ring-0 bg-transparent text-gray-900 font-medium"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </Card>
  </div>

  {#if loading}
    <Card class="border-0 shadow-lg">
      <div class="animate-pulse space-y-4">
        {#each Array(5) as _}
          <div class="h-20 bg-gray-200 rounded-lg"></div>
        {/each}
      </div>
    </Card>
  {:else}
    <Card padding="none" class="border-0 shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr class="border-b border-gray-200">
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Order #</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            {#each filteredOrders as order}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <span class="text-sm font-bold text-gray-900">{order.order_number}</span>
                </td>
                <td class="px-6 py-4">
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{order.profiles?.full_name || 'N/A'}</p>
                    <p class="text-xs text-gray-600">{order.profiles?.email || 'N/A'}</p>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-700">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-bold text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="space-y-1">
                    <p class="text-sm capitalize font-medium text-gray-900">{order.payment_method}</p>
                    <select
                      value={order.payment_status}
                      onchange={(e) => updatePaymentStatus(order.id, e.currentTarget.value)}
                      class={`text-xs font-semibold px-2 py-1 rounded-full border-2 transition-all hover:shadow-md ${getPaymentStatusColor(order.payment_status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-2">
                    <select
                      value={order.order_status}
                      onchange={(e) => updateOrderStatus(order.id, e.currentTarget.value)}
                      class={`text-xs font-semibold px-3 py-2 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(order.order_status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <div class="flex gap-1">
                      {#if order.order_status !== 'delivered' && order.order_status !== 'cancelled'}
                        <button
                          onclick={() => updateOrderStatus(order.id, 'delivered')}
                          class="flex-1 text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 font-semibold transition-all hover:shadow-sm"
                          title="Mark as Delivered"
                        >
                          Complete
                        </button>
                      {/if}
                      
                      {#if order.order_status !== 'cancelled' && order.order_status !== 'delivered'}
                        <button
                          onclick={() => {
                            if (confirm('Are you sure you want to cancel this order?')) {
                              updateOrderStatus(order.id, 'cancelled');
                            }
                          }}
                          class="flex-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-semibold transition-all hover:shadow-sm"
                          title="Cancel Order"
                        >
                          Cancel
                        </button>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    onclick={() => openOrderDetails(order)}
                    class="inline-flex items-center justify-center w-10 h-10 text-primary-600 hover:bg-primary-50 rounded-lg transition-all hover:shadow-md"
                    title="View Order Details"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if filteredOrders.length === 0}
        <div class="text-center py-16">
          <Package size={64} class="text-gray-300 mx-auto mb-4" />
          <p class="text-gray-600 font-semibold text-lg">No orders found</p>
          <p class="text-sm text-gray-500 mt-2">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Orders will appear here once customers start placing them'}
          </p>
        </div>
      {/if}
    </Card>
  {/if}
  <!-- Order Details Modal -->
  {#if showOrderModal && selectedOrder}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
      role="button"
      tabindex="0"
      onclick={() => showOrderModal = false}
      onkeydown={(e) => e.key === 'Escape' && (showOrderModal = false)}
    >
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div 
        class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" 
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        <!-- Modal Header -->
        <div class="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 class="text-2xl font-bold">Order Details - {selectedOrder.order_number}</h2>
          <button 
            onclick={() => showOrderModal = false} 
            class="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            aria-label="Close modal"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Customer Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-sm font-bold text-gray-600 mb-2">CUSTOMER INFORMATION</h3>
              <p class="text-lg font-semibold text-gray-900">{selectedOrder.profiles?.full_name || 'N/A'}</p>
              <p class="text-sm text-gray-600">{selectedOrder.profiles?.email || 'N/A'}</p>
            </div>

            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="text-sm font-bold text-gray-600 mb-2">ORDER INFORMATION</h3>
              <p class="text-sm"><span class="font-semibold">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              <p class="text-sm"><span class="font-semibold">Payment:</span> {selectedOrder.payment_method}</p>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="text-sm font-bold text-gray-700 mb-3">SHIPPING ADDRESS</h3>
            <div class="text-sm text-gray-900 space-y-1">
              <p class="font-semibold">{selectedOrder.shipping_address?.full_name || 'N/A'}</p>
              <p>{selectedOrder.shipping_address?.phone || 'N/A'}</p>
              <p>{selectedOrder.shipping_address?.address_line1 || 'N/A'}</p>
              {#if selectedOrder.shipping_address?.address_line2}
                <p>{selectedOrder.shipping_address.address_line2}</p>
              {/if}
              <p>{selectedOrder.shipping_address?.city || 'N/A'}, {selectedOrder.shipping_address?.state || 'N/A'} - {selectedOrder.shipping_address?.postal_code || 'N/A'}</p>
              <p>{selectedOrder.shipping_address?.country || 'N/A'}</p>
            </div>
          </div>

          <!-- Order Items -->
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-4">ORDER ITEMS</h3>
            <div class="space-y-3">
              {#each selectedOrder.order_items || [] as item}
                <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                  {#if item.product?.image_url}
                    <img src={item.product.image_url} alt={item.product.name} class="w-20 h-20 object-cover rounded-lg" />
                  {:else}
                    <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package size={32} class="text-gray-400" />
                    </div>
                  {/if}
                  <div class="flex-1">
                    <p class="font-semibold text-gray-900">{item.product?.name || 'N/A'}</p>
                    <p class="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p class="text-sm text-gray-600">Price: {formatCurrency(item.price_at_time)}</p>
                  </div>
                  <div class="text-right">
                    <p class="font-bold text-gray-900">{formatCurrency(item.quantity * item.price_at_time)}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Order Summary -->
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-semibold text-gray-900">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Shipping:</span>
                <span class="font-semibold text-gray-900">Free</span>
              </div>
              <div class="border-t-2 border-gray-300 pt-2 flex justify-between">
                <span class="text-lg font-bold text-gray-900">Total:</span>
                <span class="text-2xl font-bold text-primary-600">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>

          <!-- Status Badges -->
          <div class="flex gap-4">
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-600 mb-2">Order Status</p>
              <span class={`inline-flex px-4 py-2 text-sm font-bold rounded-lg border-2 ${getStatusColor(selectedOrder.order_status)}`}>
                {selectedOrder.order_status}
              </span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-600 mb-2">Payment Status</p>
              <span class={`inline-flex px-4 py-2 text-sm font-bold rounded-lg border-2 ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                {selectedOrder.payment_status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
