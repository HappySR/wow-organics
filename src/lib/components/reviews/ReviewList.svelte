<script lang="ts">
  import { formatDate } from '$lib/utils/helpers';
  import { Star, User } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';

  interface Review {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    is_verified: boolean;
    created_at: string;
    user?: { full_name: string | null };
    product?: { name: string };
  }

  interface Props {
    reviews: Review[];
    loading?: boolean;
  }

  let { reviews, loading = false }: Props = $props();

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => i < rating);
  }
</script>

{#if loading}
  <div class="space-y-4">
    {#each Array(3) as _}
      <Card>
        <div class="animate-pulse">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-14 h-14 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-5 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          <div class="h-24 bg-gray-200 rounded"></div>
        </div>
      </Card>
    {/each}
  </div>
{:else if reviews.length === 0}
  <Card>
    <div class="text-center py-16">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4">
        <Star size={40} class="text-primary-600" />
      </div>
      <p class="text-xl font-semibold text-gray-900 mb-2">No reviews yet</p>
      <p class="text-gray-600">Be the first to share your experience!</p>
    </div>
  </Card>
{:else}
  <div class="space-y-4">
    {#each reviews as review (review.id)}
      <Card hover class="transition-all duration-200">
        <div class="flex items-start space-x-4">
          <!-- User Avatar -->
          <div class="flex-shrink-0">
            <div class="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-md">
              <User size={28} class="text-primary-600" />
            </div>
          </div>
          
          <!-- Review Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0 mr-4">
                <h3 class="font-bold text-gray-900 text-lg">
                  {review.user?.full_name || 'Anonymous User'}
                </h3>
                {#if review.product}
                  <p class="text-sm text-gray-600 font-medium">{review.product.name}</p>
                {/if}
              </div>
              <span class="text-sm text-gray-500 whitespace-nowrap">
                {formatDate(review.created_at)}
              </span>
            </div>

            <!-- Rating Stars -->
            <div class="flex items-center mb-3">
              {#each renderStars(review.rating) as filled}
                <Star
                  size={18}
                  class={filled ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-300'}
                />
              {/each}
              <span class="ml-2 text-sm font-semibold text-gray-700">
                {review.rating} / 5
              </span>
            </div>

            <!-- Review Title -->
            {#if review.title}
              <h4 class="font-semibold text-gray-900 mb-2 text-lg">{review.title}</h4>
            {/if}

            <!-- Review Comment -->
            {#if review.comment}
              <p class="text-gray-700 leading-relaxed">{review.comment}</p>
            {/if}

            <!-- Verified Badge -->
            {#if review.is_verified}
              <span class="inline-flex items-center px-3 py-1 mt-3 text-xs font-bold text-green-700 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-full shadow-sm">
                ✓ Verified Purchase
              </span>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>
{/if}
