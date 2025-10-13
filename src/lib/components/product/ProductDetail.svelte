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

    try {
      console.log('Adding to cart:', {
        userId: auth.user!.id,
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity
      });

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

<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <!-- Product Image -->
  <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
    {#if product.image_url}
      <img
        src={product.image_url}
        alt={product.name}
        class="w-full h-full object-cover"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-gray-400">
        <Package size={64} />
      </div>
    {/if}
  </div>

  <!-- Product Info -->
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
    
    {#if product.category}
      <p class="text-sm text-gray-600 mb-4">{product.category.name}</p>
    {/if}

    <div class="mb-6">
      <div class="flex items-baseline space-x-2">
        <span class="text-4xl font-bold text-gray-900">
          {formatCurrency(currentPrice)}
        </span>
        {#if product.variants && product.variants.length > 0 && !selectedVariant}
          <span class="text-sm text-gray-500">onwards</span>
        {/if}
      </div>
      <p class="text-sm text-gray-600 mt-1">
        + {product.gst_percentage}% GST
      </p>
    </div>

    {#if product.description}
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
        <p class="text-gray-700 leading-relaxed">{product.description}</p>
      </div>
    {/if}

    {#if !product.is_custom}
      <!-- Variant Selection -->
      {#if product.variants && product.variants.length > 0}
        <div class="mb-6">
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
      <div class="mb-6">
        <label for="quantity-input" class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
        <div class="flex items-center space-x-4">
          <button
            onclick={() => quantity = Math.max(1, quantity - 1)}
            class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            -
          </button>
          <input
            type="number"
            bind:value={quantity}
            min="1"
            class="w-20 text-center border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            onclick={() => quantity = quantity + 1}
            class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      <!-- Price Breakdown -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 class="font-semibold text-gray-900 mb-3">Price Breakdown</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Subtotal</span>
            <span class="font-medium">{formatCurrency(priceBreakdown.subtotal)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">GST ({product.gst_percentage}%)</span>
            <span class="font-medium">{formatCurrency(priceBreakdown.gst)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Transport</span>
            <span class="font-medium">{formatCurrency(priceBreakdown.transport)}</span>
          </div>
          <div class="border-t pt-2 flex justify-between">
            <span class="font-semibold text-gray-900">Total</span>
            <span class="font-bold text-primary-600 text-lg">{formatCurrency(priceBreakdown.total)}</span>
          </div>
        </div>
      </div>

      <!-- Stock Info -->
      {#if product.stock_quantity <= 0}
        <p class="text-red-600 mb-4">Out of Stock</p>
      {:else if product.stock_quantity < 10}
        <p class="text-orange-600 mb-4">Only {product.stock_quantity} left in stock!</p>
      {:else}
        <p class="text-green-600 mb-4">In Stock</p>
      {/if}

      <!-- Action Buttons -->
      <div class="flex space-x-4">
        <Button
          variant="outline"
          size="lg"
          onclick={handleAddToCart}
          disabled={product.stock_quantity <= 0}
          class="flex-1"
        >
          <ShoppingCart size={20} class="mr-2" />
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
      <div class="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
        <h3 class="font-semibold text-primary-900 mb-2">Custom Solution</h3>
        <p class="text-primary-700 mb-4">
          This is a custom product. Please contact us for a personalized quote based on your requirements.
        </p>
        <Button onclick={() => goto('/contact')}>
          Request Quote
        </Button>
      </div>
    {/if}
  </div>
</div>
