<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { formatCurrency } from '$lib/utils/helpers';
  import Card from '$lib/components/ui/Card.svelte';
  import { requireAdmin } from '$lib/utils/guards';
  import { 
    Package, ShoppingCart, Users, TrendingUp, DollarSign, 
    Clock, ArrowUp, ArrowDown, Activity 
  } from 'lucide-svelte';

  let stats = $state({
    total_products: 0,
    total_orders: 0,
    total_users: 0,
    total_revenue: 0,
    confirmed_orders: 0,
    low_stock_products: 0
  });

  let lastMonthStats = $state({
    total_products: 0,
    total_orders: 0,
    total_users: 0,
    total_revenue: 0,
    confirmed_orders: 0,
    low_stock_products: 0
  });

  let recentOrders = $state<any[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    const canAccess = await requireAdmin();
    if (canAccess) {
      await loadDashboardData();
    }
  });

  async function loadDashboardData() {
    loading = true;
    error = null;
    
    try {
      // Get current date ranges
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      // ===== CURRENT MONTH DATA =====
      const [productsRes, ordersRes, deliveredOrdersRes, usersRes, confirmedRes, lowStockRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount'),
        supabase.from('orders').select('total_amount').eq('order_status', 'delivered'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'confirmed'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 10).gt('stock_quantity', 0)
      ]);

      stats.total_products = productsRes.count || 0;
      stats.total_users = usersRes.count || 0;
      stats.confirmed_orders = confirmedRes.count || 0;
      stats.low_stock_products = lowStockRes.count || 0;

      if (ordersRes.data) {
        stats.total_orders = ordersRes.data.length;
      }

      // Calculate revenue only from delivered orders
      if (deliveredOrdersRes.data) {
        stats.total_revenue = deliveredOrdersRes.data.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      }

      // ===== LAST MONTH DATA (data created/modified DURING last month) =====
      const [
        lastMonthProductsRes,
        lastMonthOrdersRes,
        lastMonthDeliveredOrdersRes,
        lastMonthUsersRes,
        lastMonthConfirmedRes,
        lastMonthLowStockRes
      ] = await Promise.all([
        // Products created in last month
        supabase.from('products').select('id', { count: 'exact', head: true })
          .gte('created_at', firstDayLastMonth)
          .lte('created_at', lastDayLastMonth),
        
        // All orders created in last month
        supabase.from('orders').select('total_amount')
          .gte('created_at', firstDayLastMonth)
          .lte('created_at', lastDayLastMonth),
        
        // Delivered orders from last month
        supabase.from('orders').select('total_amount')
          .eq('order_status', 'delivered')
          .gte('created_at', firstDayLastMonth)
          .lte('created_at', lastDayLastMonth),
        
        // Users created in last month
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', firstDayLastMonth)
          .lte('created_at', lastDayLastMonth),
        
        // Confirmed orders from last month
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .eq('order_status', 'confirmed')
          .gte('created_at', firstDayLastMonth)
          .lte('created_at', lastDayLastMonth),
        
        // Low stock products from last month (this is tricky, using current data as approximation)
        supabase.from('products').select('id', { count: 'exact', head: true })
          .lt('stock_quantity', 10)
          .gt('stock_quantity', 0)
          .gte('created_at', firstDayLastMonth)
          .lte('created_at', lastDayLastMonth)
      ]);

      lastMonthStats.total_products = lastMonthProductsRes.count || 0;
      lastMonthStats.total_users = lastMonthUsersRes.count || 0;
      lastMonthStats.confirmed_orders = lastMonthConfirmedRes.count || 0;
      lastMonthStats.low_stock_products = lastMonthLowStockRes.count || 0;

      if (lastMonthOrdersRes.data) {
        lastMonthStats.total_orders = lastMonthOrdersRes.data.length;
      }

      if (lastMonthDeliveredOrdersRes.data) {
        lastMonthStats.total_revenue = lastMonthDeliveredOrdersRes.data.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      }

      // Get recent orders for the table
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      recentOrders = ordersData || [];
    } catch (err) {
      console.error('Dashboard load error:', err);
      error = 'Failed to load dashboard data';
    } finally {
      loading = false;
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

  const calculatePercentageChange = (current: number, previous: number): { change: string, type: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) {
      return current > 0 ? { change: '+100%', type: 'up' } : { change: '0%', type: 'neutral' };
    }
    
    const percentChange = ((current - previous) / previous) * 100;
    const rounded = Math.round(percentChange * 10) / 10; // Round to 1 decimal place
    
    if (rounded > 0) {
      return { change: `+${rounded}%`, type: 'up' };
    } else if (rounded < 0) {
      return { change: `${rounded}%`, type: 'down' };
    } else {
      return { change: '0%', type: 'neutral' };
    }
  };

  const statsCards = $derived.by(() => {
    const productsChange = calculatePercentageChange(stats.total_products, lastMonthStats.total_products);
    const ordersChange = calculatePercentageChange(stats.total_orders, lastMonthStats.total_orders);
    const usersChange = calculatePercentageChange(stats.total_users, lastMonthStats.total_users);
    const revenueChange = calculatePercentageChange(stats.total_revenue, lastMonthStats.total_revenue);
    const confirmedChange = calculatePercentageChange(stats.confirmed_orders, lastMonthStats.confirmed_orders);
    const lowStockChange = calculatePercentageChange(stats.low_stock_products, lastMonthStats.low_stock_products);

    return [
      {
        title: 'Total Products',
        value: stats.total_products,
        icon: Package,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        change: productsChange.change,
        changeType: productsChange.type
      },
      {
        title: 'Total Orders',
        value: stats.total_orders,
        icon: ShoppingCart,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        change: ordersChange.change,
        changeType: ordersChange.type
      },
      {
        title: 'Total Customers',
        value: stats.total_users,
        icon: Users,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        change: usersChange.change,
        changeType: usersChange.type
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.total_revenue),
        icon: DollarSign,
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        change: revenueChange.change,
        changeType: revenueChange.type
      },
      {
        title: 'Confirmed Orders',
        value: stats.confirmed_orders,
        icon: Clock,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        change: confirmedChange.change,
        changeType: confirmedChange.type
      },
      {
        title: 'Low Stock Items',
        value: stats.low_stock_products,
        icon: TrendingUp,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        change: lowStockChange.change,
        changeType: lowStockChange.type
      }
    ];
  });
</script>

<svelte:head>
  <title>Admin Dashboard - WOW! Organics</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-8">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
        <Activity class="text-primary-600" size={32} />
        Dashboard
      </h1>
      <p class="text-gray-600 mt-2">Welcome back! Here's what's happening with your store today.</p>
    </div>
    <div class="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
      <Clock size={16} />
      <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
    </div>
  </div>

  {#if error}
    <Card class="border-red-200 bg-red-50">
      <p class="text-red-600">{error}</p>
    </Card>
  {/if}

  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(6) as _}
        <Card>
          <div class="animate-pulse">
            <div class="h-32 bg-gray-200 rounded"></div>
          </div>
        </Card>
      {/each}
    </div>
  {:else}
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each statsCards as stat}
        {@const Icon = stat.icon}
        <Card class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white overflow-hidden relative">
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br {stat.color} opacity-5 rounded-full -mr-16 -mt-16"></div>
          
          <div class="flex items-start justify-between relative">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
              <p class="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{stat.value}</p>
              <div class="flex items-center gap-2">
                <span class={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                  stat.changeType === 'up' ? 'bg-emerald-50 text-emerald-700' : 
                  stat.changeType === 'down' ? 'bg-red-50 text-red-700' : 
                  'bg-gray-50 text-gray-700'
                }`}>
                  {#if stat.changeType === 'up'}
                    <ArrowUp size={12} />
                  {:else if stat.changeType === 'down'}
                    <ArrowDown size={12} />
                  {/if}
                  {stat.change}
                </span>
                <span class="text-xs text-gray-500">vs last month</span>
              </div>
            </div>
            
            <div class={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
              <Icon size={26} class={stat.iconColor} />
            </div>
          </div>
        </Card>
      {/each}
    </div>

    <!-- Recent Orders -->
    <Card class="border-0 shadow-lg">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart class="text-primary-600" size={24} />
          Recent Orders
        </h2>
        <a 
          href="/admin/orders" 
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:shadow-md hover:scale-105"
        >
          View All Orders
        </a>
      </div>

      <div class="overflow-x-auto -mx-6 px-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order #</th>
              <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
              <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th class="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each recentOrders as order}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-4">
                  <span class="text-sm font-semibold text-gray-900">{order.order_number}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-gray-700">{order.profiles?.full_name || 'N/A'}</span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm font-semibold text-gray-900">{formatCurrency(order.total_amount)}</span>
                </td>
                <td class="px-4 py-4">
                  <span class={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm text-gray-700 capitalize">{order.payment_method}</span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if recentOrders.length === 0}
        <div class="text-center py-12">
          <ShoppingCart size={48} class="text-gray-300 mx-auto mb-4" />
          <p class="text-gray-600 font-medium">No recent orders</p>
          <p class="text-sm text-gray-500 mt-1">Orders will appear here once customers start placing them</p>
        </div>
      {/if}
    </Card>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {#each [
        { title: 'Manage Orders', desc: 'View and update order statuses', href: '/admin/orders', icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
        { title: 'Manage Products', desc: 'Add, edit, or remove products', href: '/admin/products', icon: Package, color: 'from-purple-500 to-purple-600' },
        { title: 'Manage Users', desc: 'View and manage user accounts', href: '/admin/users', icon: Users, color: 'from-emerald-500 to-emerald-600' }
      ] as action}
        {@const Icon = action.icon}
        <button
          onclick={() => goto(action.href)}
          class="group text-left p-6 bg-white hover:bg-gradient-to-r {action.color} rounded-xl transition-all shadow-md hover:shadow-xl hover:-translate-y-1 border border-gray-200 hover:border-transparent"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-gradient-to-br {action.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
              <Icon size={24} class="text-white" />
            </div>
            <div>
              <h3 class="font-bold text-gray-900 mb-1 group-hover:text-white transition-colors">{action.title}</h3>
              <p class="text-sm text-gray-600 group-hover:text-white/90 transition-colors">{action.desc}</p>
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
