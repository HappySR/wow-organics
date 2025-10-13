<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import type { Product, Category } from '$lib/types';
  import ProductCard from '$lib/components/product/ProductCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Leaf, Droplets, Fish, Sprout, ArrowRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let featuredProducts = $state<Product[]>([]);
  let categories = $state<Category[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
      ]);

      if (productsRes.data) featuredProducts = productsRes.data;
      if (categoriesRes.data) categories = categoriesRes.data;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  });

  const categoryIcons: Record<string, any> = {
    hydroponics: Droplets,
    aeroponics: Sprout,
    aquaponics: Fish,
    default: Leaf
  };
</script>

<svelte:head>
  <title>WOW! Organics - Premium Organic Farming Solutions</title>
  <meta name="description" content="Premium hydroponic, aeroponic, and aquaponic systems for sustainable farming in Assam, India" />
</svelte:head>

<!-- Hero Section -->
<section class="bg-gradient-to-br from-green-50 via-white to-green-50 py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
        Welcome to <span class="text-primary-600">WOW! Organics</span>
      </h1>
      <p class="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
        Revolutionizing agriculture with sustainable soilless farming solutions. 
        From hydroponics to aquaponics, we bring innovation to your farm.
      </p>
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <Button size="lg" onclick={() => goto('/products')}>
          Explore Products
          <ArrowRight size={20} class="ml-2" />
        </Button>
        <Button size="lg" variant="outline" onclick={() => goto('/about')}>
          Learn More
        </Button>
      </div>
    </div>
  </div>
</section>

<!-- Categories Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Solutions</h2>
      <p class="text-lg text-gray-600">Choose from our range of innovative farming systems</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each categories as category}
        {@const Icon = categoryIcons[category.slug] || categoryIcons.default}
        <button
          onclick={() => goto(`/products/c/${category.slug}`)}
          class="bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-primary-600 hover:shadow-lg transition-all group"
        >
          <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-600 transition-colors">
            <Icon size={32} class="text-primary-600 group-hover:text-white" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">{category.name}</h3>
          <p class="text-gray-600 text-sm">{category.description || ''}</p>
        </button>
      {/each}
    </div>
  </div>
</section>

<!-- Featured Products Section -->
<section class="py-16 bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
      <p class="text-lg text-gray-600">Discover our most popular farming systems</p>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each Array(8) as _}
          <div class="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div class="aspect-square bg-gray-200 rounded mb-4"></div>
            <div class="h-6 bg-gray-200 rounded mb-2"></div>
            <div class="h-4 bg-gray-200 rounded mb-4"></div>
            <div class="h-10 bg-gray-200 rounded"></div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each featuredProducts as product}
          <ProductCard {product} />
        {/each}
      </div>

      <div class="text-center mt-12">
        <Button size="lg" onclick={() => goto('/products')}>
          View All Products
          <ArrowRight size={20} class="ml-2" />
        </Button>
      </div>
    {/if}
  </div>
</section>

<!-- Features Section -->
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose WOW! Organics?</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Leaf size={32} class="text-primary-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">100% Organic</h3>
        <p class="text-gray-600">All our systems support completely organic and sustainable farming practices</p>
      </div>

      <div class="text-center">
        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Droplets size={32} class="text-primary-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Water Efficient</h3>
        <p class="text-gray-600">Save up to 90% water compared to traditional farming methods</p>
      </div>

      <div class="text-center">
        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sprout size={32} class="text-primary-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Expert Support</h3>
        <p class="text-gray-600">Training programs and ongoing support for farmers</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-16 bg-primary-600">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">
      Ready to Transform Your Farming?
    </h2>
    <p class="text-xl text-primary-100 mb-8">
      Join thousands of farmers who have already made the switch to sustainable farming
    </p>
    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <Button size="lg" variant="secondary" onclick={() => goto('/products')}>
        Shop Now
      </Button>
      <Button size="lg" variant="outline" onclick={() => goto('/training')} class="bg-white text-primary-600 hover:bg-gray-100">
        Join Training
      </Button>
    </div>
  </div>
</section>
