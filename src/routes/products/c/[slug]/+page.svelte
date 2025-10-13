<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/utils/supabase';
  import type { Product, Category } from '$lib/types';
  import ProductGrid from '$lib/components/product/ProductGrid.svelte';

  let products = $state<Product[]>([]);
  let category = $state<Category | null>(null);
  let loading = $state(true);

  onMount(async () => {
    await loadCategoryProducts();
  });

  async function loadCategoryProducts() {
    loading = true;
    try {
      const categorySlug = $page.params.slug;

      // Get category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (categoryData) {
        category = categoryData;

        // Get products in this category
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            variants:product_variants(*)
          `)
          .or(`category_id.eq.${categoryData.id},category.parent_id.eq.${categoryData.id}`)
          .eq('is_active', true)
          .order('name');

        if (productsData) products = productsData;
      }
    } catch (error) {
      console.error('Error loading category products:', error);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>{category?.name || 'Category'} - WOW! Organics</title>
  {#if category?.description}
    <meta name="description" content={category.description} />
  {/if}
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if category}
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{category.name}</h1>
        {#if category.description}
          <p class="text-lg text-gray-600">{category.description}</p>
        {/if}
      </div>
    {/if}

    <ProductGrid {products} {loading} />

    {#if !loading && products.length > 0}
      <div class="mt-8 text-center text-gray-600">
        Showing {products.length} product{products.length !== 1 ? 's' : ''}
      </div>
    {/if}
  </div>
</div>
