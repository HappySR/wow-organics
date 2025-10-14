<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatDate } from '$lib/utils/helpers';
  import type { Review } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ReviewForm from '$lib/components/reviews/ReviewForm.svelte';
  import ReviewList from '$lib/components/reviews/ReviewList.svelte';
  import { Star } from 'lucide-svelte';

  let reviews = $state<any[]>([]);
  let loading = $state(true);
  let showReviewForm = $state(false);
  let userProducts = $state<any[]>([]);
  let submitting = $state(false);

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
    try {
      if (!auth.user?.id) {
        userProducts = [];
        return;
      }

      // Step 1: Get all product IDs from user's delivered orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('order_status', 'delivered');
      
      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        userProducts = [];
        return;
      }

      if (!orders || orders.length === 0) {
        userProducts = [];
        return;
      }

      const orderIds = orders.map(order => order.id);

      // Step 2: Get product IDs from those orders
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id')
        .in('order_id', orderIds);
      
      if (itemsError) {
        console.error('Error loading order items:', itemsError);
        userProducts = [];
        return;
      }

      if (!orderItems || orderItems.length === 0) {
        userProducts = [];
        return;
      }

      // Extract unique product IDs
      const productIds = [...new Set(orderItems.map(item => item.product_id))];
      
      // Step 3: Check which products user has already reviewed
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('product_id')
        .eq('user_id', auth.user.id)
        .in('product_id', productIds);
      
      const reviewedProductIds = new Set(existingReviews?.map(r => r.product_id) || []);
      
      // Filter out reviewed product IDs
      const unreviewedProductIds = productIds.filter(id => !reviewedProductIds.has(id));
      
      if (unreviewedProductIds.length === 0) {
        userProducts = [];
        return;
      }
      
      // Step 4: Get product details for unreviewed products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', unreviewedProductIds);
      
      if (productsError) {
        console.error('Error loading products:', productsError);
        userProducts = [];
        return;
      }
      
      userProducts = products || [];
      console.log('User can review', userProducts.length, 'products');
      
    } catch (error) {
      console.error('Error loading user products:', error);
      userProducts = [];
    }
  }

  async function handleSubmitReview(reviewData: { product_id: string; rating: number; title: string; comment: string }) {
    if (!auth.isAuthenticated) {
      toast.info('Please login to submit a review');
      return;
    }

    submitting = true;
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: auth.user!.id,
        product_id: reviewData.product_id,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        is_verified: true // Mark as verified since it's from a delivered order
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this product');
        } else {
          throw error;
        }
      } else {
        toast.success('Review submitted successfully!');
        showReviewForm = false;
        await loadReviews();
        await loadUserProducts();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      submitting = false;
    }
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
      
      {#if auth.isAuthenticated && userProducts.length > 0}
        <Button onclick={() => showReviewForm = !showReviewForm}>
          {showReviewForm ? 'Cancel' : 'Write a Review'}
        </Button>
      {/if}
    </div>

    <!-- Review Form -->
    {#if showReviewForm}
      <Card class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Write Your Review</h2>
        
        {#if userProducts.length === 0}
          <p class="text-gray-600 py-4">
            You can only review products from delivered orders. Please purchase and receive a product first.
          </p>
        {:else}
          <ReviewForm
            products={userProducts}
            onSubmit={handleSubmitReview}
            onCancel={() => showReviewForm = false}
            loading={submitting}
          />
        {/if}
      </Card>
    {/if}

    <!-- Reviews List -->
    <ReviewList {reviews} {loading} />
  </div>
</div>
