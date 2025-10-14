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

<div class="flex flex-col sm:flex-row gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
  <!-- Product Image -->
  <div class="w-full sm:w-36 h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
    {#if product?.image_url}
      <img
        src={product.image_url}
        alt={product.name}
        class="w-full h-full object-cover"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    {/if}
  </div>

  <!-- Product Details -->
  <div class="flex-1">
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1 mr-4">
        <h3 class="text-xl font-bold text-gray-900">
          {product?.name || 'Product'}
        </h3>
        {#if variant}
          <p class="text-sm text-gray-600 font-medium mt-1">
            {variant.variant_name}: {variant.variant_value}
          </p>
        {/if}
      </div>
      <button
        onclick={onRemove}
        class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
        title="Remove item"
      >
        <Trash2 size={20} />
      </button>
    </div>

    <div class="flex items-center justify-between mt-4">
      <!-- Quantity Controls -->
      <div class="flex items-center space-x-3">
        <button
          onclick={() => onUpdateQuantity(item.quantity - 1)}
          class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-primary-50 hover:border-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          disabled={item.quantity <= 1}
        >
          <Minus size={16} />
        </button>
        <span class="w-14 text-center font-bold text-lg">{item.quantity}</span>
        <button
          onclick={() => onUpdateQuantity(item.quantity + 1)}
          class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-primary-50 hover:border-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={product && !product.is_custom && item.quantity >= product.stock_quantity}
        >
          <Plus size={16} />
        </button>
      </div>
      {#if product && !product.is_custom}
        <p class="text-xs text-gray-500 mt-1">Max: {product.stock_quantity}</p>
      {/if}

      <!-- Price -->
      <div class="text-right">
        <p class="text-sm text-gray-600 font-medium mb-1">
          {formatCurrency(price)} × {item.quantity}
        </p>
        <p class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          {formatCurrency(itemTotal)}
        </p>
      </div>
    </div>
  </div>
</div>
