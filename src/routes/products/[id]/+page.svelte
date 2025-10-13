<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { supabase } from '$lib/utils/supabase';
  import type { Product } from '$lib/types';
  import ProductDetail from '$lib/components/product/ProductDetail.svelte';
  import ReviewList from '$lib/components/reviews/ReviewList.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let product = $state<Product | null>(null);
  let reviews = $state<any[]>([]);
  let loading = $state(true);
  let reviewsLoading = $state(true);

  onMount(async () => {
    await loadProduct();
    await loadReviews();
  });

  async function loadProduct() {
    loading = true;
    try {
      const slug = $page.params.id;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          variants:product_variants(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      product = data;
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      loading = false;
    }
  }

  async function loadReviews() {
    reviewsLoading = true;
    try {
      if (!product?.id) return;

      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles(full_name)
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (data) reviews = data;
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      reviewsLoading = false;
    }
  }
</script>

<svelte:head>
  <title>{product?.name || 'Product'} - WOW! Organics</title>
  {#if product?.description}
    <meta name="description" content={product.description} />
  {/if}
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if loading}
      <div class="animate-pulse">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="aspect-square bg-gray-200 rounded-lg"></div>
          <div>
            <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div class="h-32 bg-gray-200 rounded mb-6"></div>
            <div class="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    {:else if !product}
      <Card>
        <div class="text-center py-12">
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p class="text-gray-600 mb-6">The product you're looking for doesn't exist</p>
          <a href="/products" class="text-primary-600 hover:text-primary-700 font-medium">
            Browse all products
          </a>
        </div>
      </Card>
    {:else}
      <div class="mb-12">
        <ProductDetail {product} />
      </div>

      <!-- Reviews Section -->
      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <ReviewList {reviews} loading={reviewsLoading} />
      </div>
    {/if}
  </div>
</div>
