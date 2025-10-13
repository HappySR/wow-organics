<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/utils/supabase';
  import type { Product, Category } from '$lib/types';
  import ProductCard from '$lib/components/product/ProductCard.svelte';
  import { Filter, X } from 'lucide-svelte';

  let products = $state<Product[]>([]);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let selectedCategory = $state<string | null>(null);
  let searchQuery = $state('');
  let sortBy = $state('name');
  let mobileFilterOpen = $state(false);

  onMount(async () => {
    await loadCategories();
  });

  $effect(() => {
    if (categories.length > 0) {
      const params = new URLSearchParams($page.url.search);
      selectedCategory = params.get('category');
      searchQuery = params.get('search') || '';
      loadProducts();
    }
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
          // Get all child categories too
          const childCategories = categories.filter(c => c.parent_id === category.id);
          const categoryIds = [category.id, ...childCategories.map(c => c.id)];
          
          query = query.in('category_id', categoryIds);
        }
      }

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Handle sorting
      if (sortBy === 'base_price') {
        query = query.order('base_price', { ascending: true });
      } else if (sortBy === 'base_price desc') {
        query = query.order('base_price', { ascending: false });
      } else if (sortBy === 'created_at desc') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading products:', error);
        products = [];
      } else {
        products = data || [];
      }
    } catch (error) {
      console.error('Error loading products:', error);
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
</script>

<svelte:head>
  <title>Products - WOW! Organics</title>
</svelte:head>

<div class="bg-white min-h-screen py-8">
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
        class="lg:hidden flex items-center justify-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300"
      >
        <Filter size={20} />
        <span>Filters</span>
      </button>

      <!-- Sidebar Filters -->
      <aside class={`lg:w-64 ${mobileFilterOpen ? 'block' : 'hidden'} lg:block`}>
        <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Filters</h2>
            {#if selectedCategory || searchQuery}
              <button
                onclick={clearFilters}
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear All
              </button>
            {/if}
          </div>

          <!-- Sort -->
          <div class="mb-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Sort By</h3>
            <select
              bind:value={sortBy}
              onchange={() => loadProducts()}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">Name</option>
              <option value="base_price">Price: Low to High</option>
              <option value="base_price desc">Price: High to Low</option>
              <option value="created_at desc">Newest First</option>
            </select>
          </div>

          <!-- Categories -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
            <div class="space-y-2">
              {#each categories as category}
                <button
                  onclick={() => {
                    selectedCategory = selectedCategory === category.slug ? null : category.slug;
                    window.history.pushState({}, '', selectedCategory ? `/products?category=${selectedCategory}` : '/products');
                    loadProducts();
                    mobileFilterOpen = false;
                  }}
                  class={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.slug
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-gray-100 text-gray-700'
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
          <div class="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p class="text-gray-600 text-lg mb-4">No products found</p>
            <button
              onclick={clearFilters}
              class="text-primary-600 hover:text-primary-700 font-medium"
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

          <div class="mt-8 text-center text-gray-600">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
