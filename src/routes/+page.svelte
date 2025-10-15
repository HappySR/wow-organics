<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import type { Product, Category } from '$lib/types';
  import ProductCard from '$lib/components/product/ProductCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Leaf, Droplets, Fish, Sprout, ArrowRight, Zap, Users, Award } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let featuredProducts = $state<Product[]>([]);
  let categories = $state<Category[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, category:categories(*), variants:product_variants(*)')
          .eq('is_active', true)
          .limit(8),
        supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .order('name')
      ]);

      if (productsRes.data) featuredProducts = productsRes.data;
      if (categoriesRes.data) categories = categoriesRes.data;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }

  const categoryIcons: Record<string, any> = {
    hydroponics: Droplets,
    aeroponics: Sprout,
    aquaponics: Fish,
    default: Leaf
  };

  function navigateToCategory(slug: string) {
    goto(`/products?category=${slug}`);
  }
</script>

<svelte:head>
  <title>WOW! Organics - Premium Organic Farming Solutions</title>
  <meta name="description" content="Premium hydroponic, aeroponic, and aquaponic systems for sustainable farming in Assam, India" />
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-primary-50 via-white to-primary-100 py-20 overflow-hidden">
  <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center">
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        Welcome to <span class="text-primary-600">WOW! Organics</span>
      </h1>
      <p class="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
        Transforming agriculture with sustainable soilless farming solutions. 
        From hydroponics to aquaponics, we bring innovation to your farm.
      </p>
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <Button size="lg" onclick={() => goto('/products')} class="shadow-lg hover:shadow-xl transition-shadow">
          Explore Products
          <ArrowRight size={20} class="ml-2" />
        </Button>
        <Button size="lg" variant="outline" onclick={() => goto('/about')} class="bg-white hover:bg-gray-50">
          Learn More
        </Button>
      </div>
    </div>
  </div>
</section>

<!-- Categories Section -->
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Solutions</h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Choose from our range of innovative farming systems designed for sustainability and efficiency
      </p>
    </div>

    {#if categories.length === 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each Array(3) as _}
          <div class="bg-white p-8 rounded-xl border-2 border-gray-200 animate-pulse">
            <div class="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <div class="h-6 bg-gray-200 rounded mb-3"></div>
            <div class="h-4 bg-gray-200 rounded"></div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {#each categories as category}
          {@const Icon = categoryIcons[category.slug] || categoryIcons.default}
          <button
            onclick={() => navigateToCategory(category.slug)}
            class="group bg-white p-8 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-300 shadow-lg">
              <Icon size={40} class="text-primary-600 group-hover:text-white transition-colors" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
              {category.name}
            </h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-4">
              {category.description || 'Innovative farming solutions for sustainable agriculture'}
            </p>
            <div class="flex items-center justify-center text-primary-600 font-semibold group-hover:gap-2 transition-all">
              <span>Explore</span>
              <ArrowRight size={18} class="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- Featured Products Section -->
<section class="py-20 bg-gradient-to-b from-gray-50 to-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        Discover our most popular and innovative farming systems
      </p>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each Array(8) as _}
          <div class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse shadow-sm">
            <div class="aspect-square bg-gray-200 rounded-lg mb-4"></div>
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
        <Button size="lg" onclick={() => goto('/products')} class="shadow-lg hover:shadow-xl transition-shadow">
          View All Products
          <ArrowRight size={20} class="ml-2" />
        </Button>
      </div>
    {/if}
  </div>
</section>

<!-- Features Section -->
<section class="py-20 bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose WOW! Organics?</h2>
      <p class="text-lg text-gray-600">Committed to excellence in sustainable farming</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
      <div class="text-center group">
        <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-300 shadow-lg">
          <Leaf size={40} class="text-primary-600 group-hover:text-white transition-colors" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">100% Organic</h3>
        <p class="text-gray-600 leading-relaxed">
          All our systems support completely organic and sustainable farming practices for healthier produce
        </p>
      </div>

      <div class="text-center group">
        <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300 shadow-lg">
          <Droplets size={40} class="text-blue-600 group-hover:text-white transition-colors" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Water Efficient</h3>
        <p class="text-gray-600 leading-relaxed">
          Save up to 90% water compared to traditional farming methods with our advanced systems
        </p>
      </div>

      <div class="text-center group">
        <div class="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-green-500 group-hover:to-green-600 transition-all duration-300 shadow-lg">
          <Users size={40} class="text-green-600 group-hover:text-white transition-colors" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-3">Expert Support</h3>
        <p class="text-gray-600 leading-relaxed">
          Comprehensive training programs and ongoing support to ensure your farming success
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Stats Section -->
<section class="py-16 bg-gradient-to-br from-primary-600 to-primary-500">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
      <div class="text-white">
        <div class="text-4xl md:text-5xl font-bold mb-2">500+</div>
        <div class="text-primary-100 text-lg">Happy Farmers</div>
      </div>
      <div class="text-white">
        <div class="text-4xl md:text-5xl font-bold mb-2">50+</div>
        <div class="text-primary-100 text-lg">Products Available</div>
      </div>
      <div class="text-white">
        <div class="text-4xl md:text-5xl font-bold mb-2">90%</div>
        <div class="text-primary-100 text-lg">Water Savings</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="mb-1 py-20 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
  <div class="absolute inset-0 bg-pattern opacity-10"></div>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
    <h2 class="text-3xl md:text-5xl font-bold text-white mb-6">
      Ready to Transform Your Farming?
    </h2>
    <p class="text-xl text-primary-100 mb-10 leading-relaxed">
      Join thousands of farmers who have already made the switch to sustainable farming with WOW! Organics
    </p>
    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <Button 
        size="lg" 
        variant="secondary" 
        onclick={() => goto('/products')}
        class="shadow-xl hover:shadow-2xl transition-shadow"
      >
        Shop Now
      </Button>
      <Button 
        size="lg" 
        onclick={() => goto('/training')} 
        class="bg-white text-primary-900 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-shadow"
      >
        Join Training
      </Button>
    </div>
  </div>
</section>

<style>
  .bg-grid-pattern {
    background-image: 
      linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .bg-pattern {
    background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 30px 30px;
  }
</style>
