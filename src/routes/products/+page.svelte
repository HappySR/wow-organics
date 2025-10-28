<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/utils/supabase';
  import type { Product, Category } from '$lib/types';
  import ProductCard from '$lib/components/product/ProductCard.svelte';
  import { Filter, X } from 'lucide-svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let products = $state<Product[]>([]);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state('');
  let sortBy = $state('name');
  let mobileFilterOpen = $state(false);

  onMount(async () => {
    await loadCategories();
    // Get initial params from URL
    const params = new URLSearchParams(window.location.search);
    selectedCategory = params.get('category');
    searchQuery = params.get('search') || '';
    await loadProducts();
  });

  // Watch for URL changes
  $effect(() => {
    const unsubscribe = page.subscribe(($page) => {
      if ($page.url.pathname === '/products') {
        const params = new URLSearchParams($page.url.search);
        const newCategory = params.get('category');
        const newSearch = params.get('search') || '';
        
        if (newCategory !== selectedCategory || newSearch !== searchQuery) {
          selectedCategory = newCategory;
          searchQuery = newSearch;
          loadProducts();
        }
      }
    });

    return () => unsubscribe();
  });

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) categories = data;
  }

  async function loadProducts() {
    loading = true;
    
    try {
      let query = supabase
        .from('products')
        .select('*, category:categories(*), variants:product_variants(*)')
        .eq('is_active', true);

      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          const childCategories = categories.filter(c => c.parent_id === category.id);
          const categoryIds = [category.id, ...childCategories.map(c => c.id)];
          query = query.in('category_id', categoryIds);
        }
      }

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Sorting
      const sortMap: Record<string, { column: string; ascending: boolean }> = {
        'name': { column: 'name', ascending: true },
        'base_price': { column: 'base_price', ascending: true },
        'base_price desc': { column: 'base_price', ascending: false },
        'created_at desc': { column: 'created_at', ascending: false }
      };

      const sort = sortMap[sortBy] || sortMap['name'];
      query = query.order(sort.column, { ascending: sort.ascending });

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
        products = [];
      } else {
        products = data || [];
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('An error occurred');
      products = [];
    } finally {
      loading = false;
    }
  }

  function clearFilters() {
    selectedCategory = null;
    searchQuery = '';
    window.history.pushState({}, '', '/products');
    loadProducts();
  }

  function selectCategory(categorySlug: string) {
    selectedCategory = selectedCategory === categorySlug ? null : categorySlug;
    const url = selectedCategory ? `/products?category=${selectedCategory}` : '/products';
    window.history.pushState({}, '', url);
    loadProducts();
    mobileFilterOpen = false;
  }
</script>

<svelte:head>
  <title>Products - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Our Products</h1>
      <p class="text-gray-600">Explore our complete range of soilless farming solutions</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Mobile Filter Button -->
      <button
        onclick={() => mobileFilterOpen = !mobileFilterOpen}
        class="lg:hidden flex items-center justify-center space-x-2 px-4 py-3 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
      >
        <Filter size={20} class="text-gray-700" />
        <span class="font-medium text-gray-700">Filters & Sort</span>
        {#if selectedCategory || searchQuery}
          <span class="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
            Active
          </span>
        {/if}
      </button>

      <!-- Sidebar Filters -->
      <aside class={`lg:w-64 ${mobileFilterOpen ? 'block' : 'hidden'} lg:block`}>
        <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
            {#if selectedCategory || searchQuery}
              <button
                onclick={clearFilters}
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All
              </button>
            {/if}
          </div>

          <!-- Sort -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Sort By</h3>
            <select
              bind:value={sortBy}
              onchange={() => loadProducts()}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="name">Name (A-Z)</option>
              <option value="base_price">Price: Low to High</option>
              <option value="base_price desc">Price: High to Low</option>
              <option value="created_at desc">Newest First</option>
            </select>
          </div>

          <!-- Categories -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
            <div class="space-y-2">
              {#each categories as category}
                <button
                  onclick={() => selectCategory(category.slug)}
                  class={`w-full text-left px-4 py-2.5 rounded-lg transition-all font-medium ${
                    selectedCategory === category.slug
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </aside>

      <!-- Products Grid -->
      <div class="flex-1">
        {#if loading}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each Array(9) as _}
              <div class="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div class="aspect-square bg-gray-200 rounded mb-4"></div>
                <div class="h-6 bg-gray-200 rounded mb-2"></div>
                <div class="h-4 bg-gray-200 rounded mb-4"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
              </div>
            {/each}
          </div>
        {:else if products.length === 0}
          <div class="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter size={32} class="text-gray-400" />
            </div>
            <p class="text-gray-600 text-lg mb-2 font-medium">No products found</p>
            <p class="text-gray-500 text-sm mb-4">Try adjusting your filters or search terms</p>
            <button
              onclick={clearFilters}
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              Clear filters
            </button>
          </div>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each products as product}
              <ProductCard {product} />
            {/each}
          </div>

          <div class="mt-8 text-center">
            <p class="text-gray-600">
              Showing <span class="font-semibold text-gray-900">{products.length}</span> 
              product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
