<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatDate } from '$lib/utils/helpers';
  import type { Review } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Star, User } from 'lucide-svelte';

  let reviews = $state<any[]>([]);
  let loading = $state(true);
  let showReviewForm = $state(false);
  
  let newReview = $state({
    product_id: '',
    rating: 5,
    title: '',
    comment: ''
  });

  let userProducts = $state<any[]>([]);

  onMount(async () => {
    await loadReviews();
    if (auth.isAuthenticated) {
      await loadUserProducts();
    }
  });

  async function loadReviews() {
    loading = true;
    try {
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          product:products(name, slug),
          user:profiles(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (data) reviews = data;
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      loading = false;
    }
  }

  async function loadUserProducts() {
    // Get products from user's completed orders
    const { data } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product:products(id, name)
      `)
      .eq('order_id', auth.user!.id);
    
    if (data) {
      const uniqueProducts = Array.from(
        new Map(data.map(item => [item.product_id, item.product])).values()
      );
      userProducts = uniqueProducts;
    }
  }

  async function submitReview() {
    if (!auth.isAuthenticated) {
      toast.info('Please login to submit a review');
      return;
    }

    if (!newReview.product_id || !newReview.title || !newReview.comment) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: auth.user!.id,
        product_id: newReview.product_id,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      showReviewForm = false;
      newReview = { product_id: '', rating: 5, title: '', comment: '' };
      await loadReviews();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review');
      }
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }
</script>

<svelte:head>
  <title>Customer Reviews - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Customer Reviews</h1>
        <p class="text-gray-600 mt-2">See what our customers are saying</p>
      </div>
      
      {#if auth.isAuthenticated}
        <Button onclick={() => showReviewForm = !showReviewForm}>
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </Button>
      {/if}
    </div>

    <!-- Review Form -->
    {#if showReviewForm}
      <Card class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Write Your Review</h2>
        
        <div class="space-y-4">
          <div>
            <label for="review-product" class="block text-sm font-medium text-gray-700 mb-1">
                Select Product <span class="text-red-500">*</span>
            </label>
            <select
            id="review-product"
            bind:value={newReview.product_id}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a product...</option>
              {#each userProducts as product}
                <option value={product.id}>{product.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <div>
                <span class="block text-sm font-medium text-gray-700 mb-1">
                    Rating <span class="text-red-500">*</span>
                </span>
                <!-- stars -->
            </div>
            <div class="flex space-x-2">
              {#each [1, 2, 3, 4, 5] as rating}
                <button
                  onclick={() => newReview.rating = rating}
                  class="focus:outline-none"
                >
                  <Star
                    size={32}
                    class={newReview.rating >= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label for="review-title" class="block text-sm font-medium text-gray-700 mb-1">
                Title <span class="text-red-500">*</span>
            </label>
            <input
            id="review-title"
            type="text"
            bind:value={newReview.title}
              placeholder="Summary of your experience"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label for="review-comment-field" class="block text-sm font-medium text-gray-700 mb-1">
                Your Review <span class="text-red-500">*</span>
            </label>
            <textarea
            id="review-comment-field"
            bind:value={newReview.comment}
              rows="4"
              placeholder="Tell us about your experience with this product"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>

          <Button onclick={submitReview}>
            Submit Review
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Reviews List -->
    {#if loading}
      <div class="space-y-4">
        {#each Array(3) as _}
          <Card>
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          </Card>
        {/each}
      </div>
    {:else if reviews.length === 0}
      <Card>
        <div class="text-center py-12">
          <Star size={64} class="mx-auto text-gray-400 mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">No reviews yet</h2>
          <p class="text-gray-600">Be the first to review our products!</p>
        </div>
      </Card>
    {:else}
      <div class="space-y-4">
        {#each reviews as review}
          <Card hover>
            <div class="flex items-start space-x-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={24} class="text-primary-600" />
                </div>
              </div>
              
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <h3 class="font-semibold text-gray-900">
                      {review.user?.full_name || 'Anonymous'}
                    </h3>
                    <p class="text-sm text-gray-600">
                      {review.product?.name || 'Product'}
                    </p>
                  </div>
                  <span class="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>

                <div class="flex items-center mb-2">
                  {#each renderStars(review.rating) as filled}
                    <Star
                      size={16}
                      class={filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  {/each}
                  <span class="ml-2 text-sm text-gray-600">
                    {review.rating} out of 5
                  </span>
                </div>

                {#if review.title}
                  <h4 class="font-medium text-gray-900 mb-1">{review.title}</h4>
                {/if}

                <p class="text-gray-700">{review.comment}</p>

                {#if review.is_verified}
                  <span class="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    ✓ Verified Purchase
                  </span>
                {/if}
              </div>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</div>
