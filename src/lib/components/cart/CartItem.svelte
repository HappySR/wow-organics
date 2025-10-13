<script lang="ts">
  import { formatCurrency } from '$lib/utils/helpers';
  import type { CartItem } from '$lib/types';
  import { Trash2, Plus, Minus } from 'lucide-svelte';

  interface Props {
    item: CartItem;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
  }

  let { item, onUpdateQuantity, onRemove }: Props = $props();

  const product = $derived(item.product);
  const variant = $derived(item.variant);
  const price = $derived(
    product ? product.base_price + (variant?.price_modifier || 0) : 0
  );
  const itemTotal = $derived(price * item.quantity);
</script>

<div class="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-gray-200">
  <!-- Product Image -->
  <div class="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
    {#if product?.image_url}
      <img
        src={product.image_url}
        alt={product.name}
        class="w-full h-full object-cover"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    {/if}
  </div>

  <!-- Product Details -->
  <div class="flex-1">
    <div class="flex justify-between items-start mb-2">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">
          {product?.name || 'Product'}
        </h3>
        {#if variant}
          <p class="text-sm text-gray-600">
            {variant.variant_name}: {variant.variant_value}
          </p>
        {/if}
      </div>
      <button
        onclick={onRemove}
        class="text-red-600 hover:text-red-700 transition-colors"
        title="Remove item"
      >
        <Trash2 size={20} />
      </button>
    </div>

    <div class="flex items-center justify-between mt-4">
      <!-- Quantity Controls -->
      <div class="flex items-center space-x-2">
        <button
          onclick={() => onUpdateQuantity(item.quantity - 1)}
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={item.quantity <= 1}
        >
          <Minus size={16} />
        </button>
        <span class="w-12 text-center font-medium">{item.quantity}</span>
        <button
          onclick={() => onUpdateQuantity(item.quantity + 1)}
          class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <!-- Price -->
      <div class="text-right">
        <p class="text-sm text-gray-600">
          {formatCurrency(price)} × {item.quantity}
        </p>
        <p class="text-lg font-bold text-gray-900">
          {formatCurrency(itemTotal)}
        </p>
      </div>
    </div>
  </div>
</div>
