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
            <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          <div class="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    {/each}
  </div>
{:else if reviews.length === 0}
  <Card>
    <div class="text-center py-12">
      <Star size={64} class="mx-auto text-gray-400 mb-4" />
      <p class="text-gray-600">No reviews yet</p>
    </div>
  </Card>
{:else}
  <div class="space-y-4">
    {#each reviews as review (review.id)}
      <Card hover>
        <div class="flex items-start space-x-4">
          <!-- User Avatar -->
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={24} class="text-primary-600" />
            </div>
          </div>
          
          <!-- Review Content -->
          <div class="flex-1">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="font-semibold text-gray-900">
                  {review.user?.full_name || 'Anonymous User'}
                </h3>
                {#if review.product}
                  <p class="text-sm text-gray-600">{review.product.name}</p>
                {/if}
              </div>
              <span class="text-sm text-gray-500">
                {formatDate(review.created_at)}
              </span>
            </div>

            <!-- Rating Stars -->
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

            <!-- Review Title -->
            {#if review.title}
              <h4 class="font-medium text-gray-900 mb-1">{review.title}</h4>
            {/if}

            <!-- Review Comment -->
            {#if review.comment}
              <p class="text-gray-700 leading-relaxed">{review.comment}</p>
            {/if}

            <!-- Verified Badge -->
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
