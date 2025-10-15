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
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
        <div class="aspect-square bg-gradient-to-br from-gray-200 to-gray-300"></div>
        <div class="p-5 space-y-3">
          <div class="h-6 bg-gray-200 rounded-lg"></div>
          <div class="h-4 bg-gray-200 rounded-lg w-3/4"></div>
          <div class="h-8 bg-gray-200 rounded-lg w-1/2"></div>
          <div class="h-10 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if products.length === 0}
  <div class="text-center py-20">
    <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 class="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
    <p class="text-gray-600">Try adjusting your search or filters</p>
  </div>
{:else}
  <div class={gridClasses}>
    {#each products as product (product.id)}
      <ProductCard {product} />
    {/each}
  </div>
{/if}
