<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency, calculateTotal } from '$lib/utils/helpers';
  import type { Product, ProductVariant } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { ShoppingCart, Package } from 'lucide-svelte';

  interface Props {
    product: Product;
  }

  let { product }: Props = $props();

  let selectedVariant = $state<ProductVariant | null>(null);
  let quantity = $state(1);

  const variantOptions = $derived(
    product.variants?.map(v => ({
      value: v.id,
      label: `${v.variant_value} - ${formatCurrency(product.base_price + v.price_modifier)}`
    })) || []
  );

  const currentPrice = $derived(
    product.base_price + (selectedVariant?.price_modifier || 0)
  );

  const priceBreakdown = $derived(
    calculateTotal(currentPrice, quantity, product.gst_percentage, product.transport_charges)
  );

  async function handleAddToCart() {
    if (!auth.isAuthenticated) {
      toast.info('Please login to add items to cart');
      goto('/auth/login');
      return;
    }

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    if (product.stock_quantity <= 0 && !product.is_custom) {
      toast.error('Product is out of stock');
      return;
    }

    if (quantity > product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} units available`);
      return;
    }

    try {
      await cart.addItem(auth.user!.id, product.id, selectedVariant?.id || null, quantity);
      toast.success('Added to cart successfully');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();
    goto('/cart');
  }

  function handleVariantChange(e: Event) {
    const variantId = (e.target as HTMLSelectElement).value;
    selectedVariant = product.variants?.find(v => v.id === variantId) || null;
  }
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
  <!-- Product Image -->
  <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-xl">
    {#if product.image_url}
      <img
        src={product.image_url}
        alt={product.name}
        class="w-full h-full object-cover"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <Package size={80} />
      </div>
    {/if}
  </div>

  <!-- Product Info -->
  <div class="space-y-6">
    <div>
      <h1 class="text-4xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>
      
      {#if product.category}
        <span class="inline-block px-4 py-1.5 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-sm font-semibold rounded-full">
          {product.category.name}
        </span>
      {/if}
    </div>

    <div class="border-t border-b border-gray-200 py-6">
      <div class="flex items-baseline space-x-3">
        <span class="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          {formatCurrency(currentPrice)}
        </span>
        {#if product.variants && product.variants.length > 0 && !selectedVariant}
          <span class="text-lg text-gray-500 font-medium">onwards</span>
        {/if}
      </div>
      <p class="text-sm text-gray-600 mt-2 font-medium">
        + {product.gst_percentage}% GST included
      </p>
    </div>

    {#if product.description}
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-3">Description</h2>
        <p class="text-gray-700 leading-relaxed text-base">{product.description}</p>
      </div>
    {/if}

    {#if !product.is_custom}
      <!-- Variant Selection -->
      {#if product.variants && product.variants.length > 0}
        <div>
          <Select
            label="Select Capacity"
            options={variantOptions}
            value={selectedVariant?.id || ''}
            onchange={handleVariantChange}
            placeholder="Choose a variant"
            required
          />
        </div>
      {/if}

      <!-- Quantity -->
      <div>
        <label for="quantity-input" class="block text-sm font-semibold text-gray-700 mb-3">Quantity</label>
        <div class="flex items-center space-x-4">
          <button
            onclick={() => quantity = Math.max(1, quantity - 1)}
            class="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-primary-50 hover:border-primary-400 transition-all font-bold text-lg"
          >
            -
          </button>
          <input
            type="number"
            bind:value={quantity}
            min="1"
            max={product.stock_quantity}
            class="w-24 text-center border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onclick={() => quantity = Math.min(product.stock_quantity, quantity + 1)}
            class="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-primary-50 hover:border-primary-400 transition-all font-bold text-lg"
          >
            +
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-2">Available: {product.stock_quantity} units</p>
      </div>

      <!-- Price Breakdown -->
      <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 class="font-bold text-gray-900 mb-4 text-lg">Price Breakdown</h3>
        <div class="space-y-3 text-base">
          <div class="flex justify-between">
            <span class="text-gray-700 font-medium">Subtotal</span>
            <span class="font-bold text-gray-900">{formatCurrency(priceBreakdown.subtotal)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-700 font-medium">GST ({product.gst_percentage}%)</span>
            <span class="font-bold text-gray-900">{formatCurrency(priceBreakdown.gst)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-700 font-medium">Transport</span>
            <span class="font-bold text-gray-900">{formatCurrency(priceBreakdown.transport)}</span>
          </div>
          <div class="border-t-2 border-gray-300 pt-3 flex justify-between items-baseline">
            <span class="font-bold text-gray-900 text-lg">Total</span>
            <span class="font-bold text-3xl bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">{formatCurrency(priceBreakdown.total)}</span>
          </div>
        </div>
      </div>

      <!-- Stock Info -->
      {#if product.stock_quantity <= 0}
        <div class="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 font-semibold text-center">Out of Stock</p>
        </div>
      {:else if product.stock_quantity < 10}
        <div class="px-4 py-3 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
          <p class="text-orange-700 font-semibold text-center">Only {product.stock_quantity} left in stock!</p>
        </div>
      {:else}
        <div class="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
          <p class="text-green-700 font-semibold text-center">In Stock</p>
        </div>
      {/if}

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          size="lg"
          onclick={handleAddToCart}
          disabled={product.stock_quantity <= 0}
          class="flex-1"
        >
          <ShoppingCart size={22} class="mr-2" />
          Add to Cart
        </Button>
        <Button
          size="lg"
          onclick={handleBuyNow}
          disabled={product.stock_quantity <= 0}
          class="flex-1"
        >
          Buy Now
        </Button>
      </div>
    {:else}
      <!-- Custom Product -->
      <div class="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300 rounded-xl p-8">
        <h3 class="font-bold text-primary-900 mb-3 text-xl">Custom Solution Available</h3>
        <p class="text-primary-800 mb-6 leading-relaxed">
          This is a custom product tailored to your specific needs. Contact us for a personalized quote based on your requirements.
        </p>
        <Button onclick={() => goto('/contact')} size="lg" fullWidth>
          Request Custom Quote
        </Button>
      </div>
    {/if}
  </div>
</div>
