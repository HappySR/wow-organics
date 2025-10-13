<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency } from '$lib/utils/helpers';
  import type { Product } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { Edit, Trash2, Plus, Search, ToggleLeft, ToggleRight, Package, AlertTriangle, RefreshCw } from 'lucide-svelte';

  let products = $state<Product[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');

  onMount(async () => {
    await loadProducts();
  });

  async function loadProducts() {
    loading = true;
    try {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false });

      if (data) products = data;
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      loading = false;
    }
  }

  async function toggleProductStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await loadProducts();
    } catch (error) {
      toast.error('Failed to update product status');
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Product deleted successfully');
      await loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  }

  const filteredProducts = $derived(
    products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const stats = $derived({
    total: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    lowStock: products.filter(p => p.stock_quantity < 10).length
  });
</script>

<svelte:head>
  <title>Products Management - Admin</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
        <Package class="text-primary-600" size={32} />
        Products Management
      </h1>
      <p class="text-gray-600 mt-2">Manage your product catalog</p>
    </div>
    <div class="flex gap-2">
      <button
        onclick={() => loadProducts()}
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all hover:shadow-md hover:scale-105"
      >
        <RefreshCw size={18} />
        Refresh
      </button>
      <Button onclick={() => goto('/admin/products/add')}>
        <Plus size={20} class="mr-2" />
        Add Product
      </Button>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card class="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Total Products</p>
          <p class="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Package size={24} class="text-blue-600" />
        </div>
      </div>
    </Card>

    <Card class="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Active</p>
          <p class="text-3xl font-bold text-gray-900">{stats.active}</p>
        </div>
        <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <ToggleRight size={24} class="text-emerald-600" />
        </div>
      </div>
    </Card>

    <Card class="border-0 shadow-md bg-gradient-to-br from-gray-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Inactive</p>
          <p class="text-3xl font-bold text-gray-900">{stats.inactive}</p>
        </div>
        <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
          <ToggleLeft size={24} class="text-gray-600" />
        </div>
      </div>
    </Card>

    <Card class="border-0 shadow-md bg-gradient-to-br from-red-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Low Stock</p>
          <p class="text-3xl font-bold text-gray-900">{stats.lowStock}</p>
        </div>
        <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertTriangle size={24} class="text-red-600" />
        </div>
      </div>
    </Card>
  </div>

  <!-- Search -->
  <Card class="border-0 shadow-md">
    <div class="flex items-center space-x-3">
      <Search size={20} class="text-gray-400 flex-shrink-0" />
      <Input
        bind:value={searchQuery}
        placeholder="Search products by name or description..."
        class="flex-1 border-0 focus:ring-0 bg-transparent"
      />
    </div>
  </Card>

  {#if loading}
    <Card class="border-0 shadow-lg">
      <div class="animate-pulse space-y-4">
        {#each Array(5) as _}
          <div class="h-16 bg-gray-200 rounded-lg"></div>
        {/each}
      </div>
    </Card>
  {:else}
    <Card padding="none" class="border-0 shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr class="border-b border-gray-200">
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Product</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Price</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            {#each filteredProducts as product}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 overflow-hidden shadow-sm">
                      {#if product.image_url}
                        <img src={product.image_url} alt={product.name} class="w-full h-full object-cover" />
                      {:else}
                        <div class="w-full h-full flex items-center justify-center">
                          <Package size={24} class="text-gray-400" />
                        </div>
                      {/if}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{product.name}</p>
                      <p class="text-sm text-gray-600">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                    {product.category?.name || 'N/A'}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-bold text-gray-900">{formatCurrency(product.base_price)}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <span class={`text-sm font-bold ${product.stock_quantity < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock_quantity}
                    </span>
                    {#if product.stock_quantity < 10}
                      <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded-full border border-red-200">
                        <AlertTriangle size={12} />
                        Low
                      </span>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <button
                    onclick={() => toggleProductStatus(product.id, product.is_active)}
                    class="flex items-center space-x-2 transition-all hover:scale-105"
                  >
                    {#if product.is_active}
                      <div class="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                        <ToggleRight size={20} />
                        <span class="text-xs font-semibold">Active</span>
                      </div>
                    {:else}
                      <div class="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg border border-gray-300">
                        <ToggleLeft size={20} />
                        <span class="text-xs font-semibold">Inactive</span>
                      </div>
                    {/if}
                  </button>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center space-x-2">
                    <a
                      href={`/admin/products/edit/${product.slug}`}
                      class="inline-flex items-center justify-center w-10 h-10 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:shadow-md"
                      title="View Product"
                    >
                      <Edit size={18} />
                    </a>
                    <button
                      onclick={() => deleteProduct(product.id, product.name)}
                      class="inline-flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:shadow-md"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if filteredProducts.length === 0}
        <div class="text-center py-16">
          <Package size={64} class="text-gray-300 mx-auto mb-4" />
          <p class="text-gray-600 font-semibold text-lg">No products found</p>
          <p class="text-sm text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search query' : 'Start by adding your first product'}
          </p>
        </div>
      {/if}
    </Card>
  {/if}
</div>
