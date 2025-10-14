<script lang="ts">
  import { Star } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  interface Props {
    products: Array<{ id: string; name: string }>;
    onSubmit: (review: { product_id: string; rating: number; title: string; comment: string }) => void;
    onCancel?: () => void;
    loading?: boolean;
  }

  let { products, onSubmit, onCancel, loading = false }: Props = $props();

  let productId = $state('');
  let rating = $state(5);
  let title = $state('');
  let comment = $state('');

  const productOptions = $derived(
    products.map(p => ({ value: p.id, label: p.name }))
  );

  function handleSubmit() {
    if (!productId || !title || !comment) {
      return;
    }
    onSubmit({ product_id: productId, rating, title, comment });
  }

  function handleRatingClick(value: number) {
    rating = value;
  }
</script>

<div class="space-y-6">
  <Select
    label="Select Product"
    options={productOptions}
    bind:value={productId}
    placeholder="Choose a product to review"
    required
  />

  <div>
    <span class="block text-sm font-semibold text-gray-700 mb-3">
      Rating <span class="text-red-500">*</span>
    </span>
    <div class="flex space-x-2">
      {#each [1, 2, 3, 4, 5] as value}
        <button
          type="button"
          onclick={() => handleRatingClick(value)}
          class="focus:outline-none transition-all hover:scale-110 active:scale-95"
        >
          <Star
            size={36}
            class={rating >= value 
              ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' 
              : 'text-gray-300 hover:text-gray-400'}
          />
        </button>
      {/each}
    </div>
    <p class="text-sm text-gray-600 mt-2 font-medium">{rating} out of 5 stars</p>
  </div>

  <Input
    label="Review Title"
    bind:value={title}
    placeholder="Summary of your experience"
    required
  />

  <div>
    <label for="review-comment" class="block text-sm font-semibold text-gray-700 mb-2">
      Your Review <span class="text-red-500">*</span>
    </label>
    <textarea
      id="review-comment"
      bind:value={comment}
      rows="5"
      placeholder="Tell us about your experience with this product..."
      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      required
    ></textarea>
  </div>

  <div class="flex space-x-3">
    <Button
      onclick={handleSubmit}
      loading={loading}
      disabled={!productId || !title || !comment}
      class="flex-1"
    >
      Submit Review
    </Button>
    {#if onCancel}
      <Button variant="outline" onclick={onCancel}>
        Cancel
      </Button>
    {/if}
  </div>
</div>
