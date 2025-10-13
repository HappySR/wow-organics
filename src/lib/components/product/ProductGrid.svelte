<script lang="ts">
  import type { Product } from '$lib/types';
  import ProductCard from './ProductCard.svelte';

  interface Props {
    products: Product[];
    loading?: boolean;
    columns?: 2 | 3 | 4;
  }

  let {
    products,
    loading = false,
    columns = 3
  }: Props = $props();

  const gridClasses = $derived(
    `grid gap-6 ${
      columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }`
  );
</script>

{#if loading}
  <div class={gridClasses}>
    {#each Array(columns * 3) as _}
      <div class="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div class="aspect-square bg-gray-200 rounded mb-4"></div>
        <div class="h-6 bg-gray-200 rounded mb-2"></div>
        <div class="h-4 bg-gray-200 rounded mb-4"></div>
        <div class="h-10 bg-gray-200 rounded"></div>
      </div>
    {/each}
  </div>
{:else if products.length === 0}
  <div class="text-center py-12">
    <p class="text-gray-600 text-lg">No products found</p>
  </div>
{:else}
  <div class={gridClasses}>
    {#each products as product (product.id)}
      <ProductCard {product} />
    {/each}
  </div>
{/if}
