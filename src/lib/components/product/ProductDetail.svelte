<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency, calculateTotal } from '$lib/utils/helpers';
  import type { Product, ProductVariant } from '$lib/types';
  import Button from '$lib/components/ui/Button.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { ShoppingCart, Package, ChevronLeft, ChevronRight, Play } from 'lucide-svelte';

  interface Props {
    product: Product;
  }

  let { product }: Props = $props();

  let selectedVariant = $state<ProductVariant | null>(null);
  let quantity = $state(1);
  let mediaFiles = $state<{ type: 'image' | 'video'; url: string }[]>([]);
  let currentMediaIndex = $state(0);
  let loadingMedia = $state(true);
  let touchStartX = $state(0);
  let touchEndX = $state(0);
  let isHovering = $state(false);
  let showControlsTimeout: ReturnType<typeof setTimeout> | null = null;
  let isVideoPlaying = $state(false);

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

  onMount(async () => {
    await loadMedia();
  });

  async function loadMedia() {
    loadingMedia = true;
    try {
      console.log('Loading media for product:', product.id);
      
      const { data, error } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order');

      if (error) {
        console.error('Error loading media from product_media:', error);
      }

      console.log('Media data received:', data);

      if (data && data.length > 0) {
        mediaFiles = data.map(m => ({ 
          type: m.media_type as 'image' | 'video', 
          url: m.media_url 
        }));
        console.log('Media files loaded:', mediaFiles);
      } else if (product.image_url) {
        // Fallback to old image_url
        console.log('No media found, using fallback image_url:', product.image_url);
        mediaFiles = [{ type: 'image', url: product.image_url }];
      } else {
        console.log('No media available for this product');
        mediaFiles = [];
      }
    } catch (error) {
      console.error('Exception loading media:', error);
      if (product.image_url) {
        mediaFiles = [{ type: 'image', url: product.image_url }];
      }
    } finally {
      loadingMedia = false;
    }
  }

  function nextMedia() {
    if (mediaFiles.length > 1) {
      currentMediaIndex = (currentMediaIndex + 1) % mediaFiles.length;
    }
  }

  function prevMedia() {
    if (mediaFiles.length > 1) {
      currentMediaIndex = currentMediaIndex === 0 ? mediaFiles.length - 1 : currentMediaIndex - 1;
    }
  }

  // Touch handlers for mobile swipe
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e: TouchEvent) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    showControlsTemporarily();
  }

  function handleSwipe() {
    if (mediaFiles.length <= 1) return;
    
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next
        nextMedia();
      } else {
        // Swipe right - previous
        prevMedia();
      }
    }
  }

  function showControlsTemporarily() {
    isHovering = true;
    if (showControlsTimeout) {
      clearTimeout(showControlsTimeout);
    }
    showControlsTimeout = setTimeout(() => {
      isHovering = false;
    }, 2000);
  }

  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if (mediaFiles.length <= 1) return;
    
    if (e.key === 'ArrowLeft') {
      prevMedia();
    } else if (e.key === 'ArrowRight') {
      nextMedia();
    }
  }

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

<svelte:window onkeydown={handleKeydown} />

<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
  <!-- Media Gallery -->
  <div class="space-y-4">
    {#if loadingMedia}
      <div class="aspect-square bg-gray-200 rounded-2xl animate-pulse"></div>
    {:else if mediaFiles.length > 0}
      <div 
        class="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 select-none"
        ontouchstart={handleTouchStart}
        ontouchend={handleTouchEnd}
        onmouseenter={() => isHovering = true}
        onmouseleave={() => isHovering = false}
        role="region"
        aria-label="Product media gallery"
      >
        {#if mediaFiles[currentMediaIndex].type === 'image'}
          <img
            src={mediaFiles[currentMediaIndex].url}
            alt="{product.name} - Image {currentMediaIndex + 1}"
            class="w-full h-full object-contain bg-white"
            draggable="false"
          />
        {:else}
          <video
            src={mediaFiles[currentMediaIndex].url}
            controls
            class="w-full h-full object-contain bg-black"
            controlsList="nodownload"
            onplay={() => isVideoPlaying = true}
            onpause={() => isVideoPlaying = false}
            onended={() => isVideoPlaying = false}
          >
            <track kind="captions" />
          </video>
          {#if !isVideoPlaying}
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div class="w-20 h-20 bg-black/30 rounded-full flex items-center justify-center">
                <Play size={40} class="text-white ml-1" />
              </div>
            </div>
          {/if}
        {/if}

        <!-- Always show navigation if more than 1 media -->
        {#if mediaFiles.length > 1}
          <!-- Previous button -->
          <button
            onclick={prevMedia}
            class={`absolute left-2 md:left-3 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg z-10 active:scale-95 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}
            aria-label="Previous media"
            type="button"
          >
            <ChevronLeft size={20} class="md:w-6 md:h-6" />
          </button>
          
          <!-- Next button -->
          <button
            onclick={nextMedia}
            class={`absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-black/60 hover:bg-black/80 text-white rounded-full shadow-lg z-10 active:scale-95 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}
            aria-label="Next media"
            type="button"
          >
            <ChevronRight size={20} class="md:w-6 md:h-6" />
          </button>

          <!-- Media indicators (dots) -->
          <div class="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
            {#each mediaFiles as media, index}
              <button
                onclick={() => currentMediaIndex = index}
                class={`transition-all ${
                  currentMediaIndex === index
                    ? 'w-6 md:w-8 h-1.5 md:h-2 bg-white shadow-lg'
                    : 'w-1.5 md:w-2 h-1.5 md:h-2 bg-white/50 hover:bg-white/75'
                } rounded-full`}
                aria-label={`View media ${index + 1}`}
                type="button"
              ></button>
            {/each}
          </div>

          <!-- Media counter -->
          <div class={`absolute top-3 md:top-4 right-3 md:right-4 px-2.5 md:px-3 py-1 md:py-1.5 bg-black/60 text-white text-xs md:text-sm font-semibold rounded-full shadow-lg transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
            {currentMediaIndex + 1} / {mediaFiles.length}
          </div>

          <!-- Swipe instruction for mobile (shows briefly) -->
          <div class="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-full md:hidden opacity-0 animate-fade-in-out pointer-events-none">
            Swipe to navigate
          </div>
        {/if}
      </div>

      <!-- Thumbnail strip -->
      {#if mediaFiles.length > 1}
        <div class="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {#each mediaFiles as media, index}
            <button
              onclick={() => currentMediaIndex = index}
              class={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                currentMediaIndex === index
                  ? 'border-primary-600 ring-2 ring-primary-200 scale-105'
                  : 'border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100'
              }`}
              type="button"
              aria-label={`View ${media.type} ${index + 1}`}
            >
              {#if media.type === 'image'}
                <img 
                  src={media.url} 
                  alt="Thumbnail {index + 1}" 
                  class="w-full h-full object-contain bg-white" 
                  draggable="false"
                />
              {:else}
                <div class="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Play size={20} class="md:w-6 md:h-6 text-white" />
                </div>
              {/if}
              {#if currentMediaIndex === index}
                <div class="absolute inset-0 border-2 border-primary-600 rounded-lg pointer-events-none"></div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center border border-gray-200">
        <div class="text-center">
          <Package size={80} class="text-gray-400 mx-auto mb-3" />
          <p class="text-gray-500 text-sm">No media available</p>
        </div>
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
            class="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-primary-50 hover:border-primary-400 transition-all font-bold text-lg active:scale-95"
            type="button"
          >
            -
          </button>
          <input
            id="quantity-input"
            type="number"
            bind:value={quantity}
            min="1"
            max={product.stock_quantity}
            class="w-24 text-center border-2 border-gray-300 rounded-lg px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onclick={() => quantity = Math.min(product.stock_quantity, quantity + 1)}
            class="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-primary-50 hover:border-primary-400 transition-all font-bold text-lg active:scale-95"
            type="button"
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

<style>
  @keyframes fade-in-out {
    0%, 100% { opacity: 0; }
    10%, 90% { opacity: 1; }
  }
  
  .animate-fade-in-out {
    animation: fade-in-out 3s ease-in-out;
  }

  /* Custom scrollbar for thumbnail strip */
  .scrollbar-thin::-webkit-scrollbar {
    height: 6px;
  }
  
  .scrollbar-thumb-gray-400::-webkit-scrollbar-thumb {
    background-color: #9ca3af;
    border-radius: 3px;
  }
  
  .scrollbar-track-gray-200::-webkit-scrollbar-track {
    background-color: #e5e7eb;
    border-radius: 3px;
  }
</style>
