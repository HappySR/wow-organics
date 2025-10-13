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
                    <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
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
                  <a
                    href={`/orders/${order.id}`}
                    target="_blank"
                    class="inline-flex items-center justify-center w-10 h-10 text-primary-600 hover:bg-primary-50 rounded-lg transition-all hover:shadow-md"
                    title="View Order Details"
                  >
                    <Eye size={20} />
                  </a>
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
</div>
