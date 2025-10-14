<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency } from '$lib/utils/helpers';
  import type { Product } from '$lib/types';
  import { ShoppingCart } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    product: Product;
  }

  let { product }: Props = $props();

  const handleAddToCart = async () => {
    if (!auth.isAuthenticated) {
      toast.info('Please login to add items to cart');
      goto('/auth/login');
      return;
    }

    if (product.variants && product.variants.length > 0) {
      toast.info('Please select product options from the product page');
      goto(`/products/${product.slug}`);
      return;
    }

    try {
      await cart.addItem(auth.user!.id, product.id, null, 1);
      await cart.loadCart(auth.user!.id);
      toast.success('Added to cart successfully');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!auth.isAuthenticated) {
      toast.info('Please login to purchase');
      goto('/auth/login');
      return;
    }

    if (product.variants && product.variants.length > 0) {
      toast.info('Please select product options');
      goto(`/products/${product.slug}`);
      return;
    }

    try {
      await cart.addItem(auth.user!.id, product.id, null, 1);
      await cart.loadCart(auth.user!.id);
      goto('/checkout');
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error('Failed to process. Please try again.');
    }
  };
</script>

<div class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 overflow-hidden">
  <a href={`/products/${product.slug}`} class="block">
    <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
      {#if product.image_url}
        <img
          src={product.image_url}
          alt={product.name}
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      {:else}
        <div class="w-full h-full flex items-center justify-center text-gray-400">
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      {/if}
      
      <!-- Stock badge -->
      {#if product.stock_quantity <= 0 && !product.is_custom}
        <div class="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
          Out of Stock
        </div>
      {:else if product.stock_quantity < 10 && !product.is_custom}
        <div class="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
          Only {product.stock_quantity} left!
        </div>
      {/if}
    </div>
  </a>

  <div class="p-5">
    <a href={`/products/${product.slug}`} class="block mb-3">
      <h3 class="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight">
        {product.name}
      </h3>
    </a>

    {#if product.description}
      <p class="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {product.description}
      </p>
    {/if}

    <div class="flex items-baseline space-x-2 mb-4">
      <span class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
        {formatCurrency(product.base_price)}
      </span>
      {#if product.variants && product.variants.length > 0}
        <span class="text-sm text-gray-500 font-medium">onwards</span>
      {/if}
    </div>

    {#if product.is_custom}
      <a href={`/products/${product.slug}`} class="block">
        <Button variant="primary" fullWidth>
          Get Custom Quote
        </Button>
      </a>
    {:else}
      <div class="flex space-x-2">
        <Button
          variant="outline"
          onclick={handleAddToCart}
          disabled={product.stock_quantity <= 0}
          class="flex-1"
        >
          <ShoppingCart size={16} class="mr-1" />
          Add
        </Button>
        <Button
          variant="primary"
          onclick={handleBuyNow}
          disabled={product.stock_quantity <= 0}
          class="flex-1"
        >
          Buy Now
        </Button>
      </div>
    {/if}
  </div>
</div>
