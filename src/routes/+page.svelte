<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import type { Product, Category } from '$lib/types';
  import ProductCard from '$lib/components/product/ProductCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { Leaf, Droplets, Fish, Sprout, ArrowRight, Users, Award, AudioWaveform, Shapes } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let featuredProducts = $state<Product[]>([]);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let animatedStats = $state({ farmers: 0, products: 0, water: 0 });
  let hasAnimated = $state(false);

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
    auxiliaries: AudioWaveform,
    'custom-equipment': Shapes,
    default: Leaf
  };

  function navigateToCategory(slug: string) {
    goto(`/products?category=${slug}`);
  }

  function animateStats() {
    if (hasAnimated) return;
    hasAnimated = true;
    
    const duration = 2000;
    const fps = 60;
    const frames = (duration / 1000) * fps;
    const increment = {
      farmers: 500 / frames,
      products: 50 / frames,
      water: 90 / frames
    };
    
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      animatedStats = {
        farmers: Math.min(Math.floor(increment.farmers * frame), 500),
        products: Math.min(Math.floor(increment.products * frame), 100),
        water: Math.min(Math.floor(increment.water * frame), 90)
      };
      
      if (frame >= frames) {
        clearInterval(timer);
        animatedStats = { farmers: 500, products: 100, water: 90 };
      }
    }, 1000 / fps);
  }

  function intersectionObserver(node: HTMLElement, callback: () => void) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback();
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    
    observer.observe(node);
    
    return {
      destroy() {
        observer.disconnect();
      }
    };
  }
</script>

<svelte:head>
  <title>WOW! Organics - Premium Organic Farming Solutions</title>
  <meta name="description" content="Premium hydroponic, aeroponic, and aquaponic systems for sustainable farming in Assam, India" />
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-32 overflow-hidden min-h-[85vh] flex items-center">
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="absolute top-20 left-10 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
    <div class="absolute top-40 right-20 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
  </div>

  <!-- Floating Icons -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-1/4 left-[10%] animate-float">
      <Leaf size={40} class="text-primary-400 opacity-40" />
    </div>
    <div class="absolute top-1/3 right-[15%] animate-float animation-delay-1000">
      <Droplets size={48} class="text-primary-300 opacity-40" />
    </div>
    <div class="absolute bottom-1/4 left-[20%] animate-float animation-delay-2000">
      <Sprout size={36} class="text-primary-500 opacity-40" />
    </div>
    <div class="absolute top-1/2 right-[25%] animate-float animation-delay-3000">
      <Fish size={44} class="text-primary-400 opacity-40" />
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <div class="text-center">
      <!-- Main Heading with Gradient Text -->
      <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up">
        Welcome to
        <span class="block mt-2 bg-gradient-to-r from-primary-300 via-primary-400 to-primary-500 bg-clip-text text-transparent drop-shadow-lg">
          WOW! Organics
        </span>
      </h1>

      <!-- Subheading -->
      <p class="text-xl md:text-2xl text-gray-200 mb-4 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
        Transforming agriculture with sustainable soilless farming solutions.
      </p>
      <p class="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
        From hydroponics to aquaponics, we bring innovation to your farm.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in-up animation-delay-600">
        <Button 
          size="lg" 
          onclick={() => goto('/products')} 
          class="bg-primary-500 text-gray-900 hover:bg-primary-400 shadow-2xl hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300 font-bold border-2 border-primary-400"
        >
          Explore Products
          <ArrowRight size={20} class="ml-2" />
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          onclick={() => goto('/about')} 
          class="bg-transparent border-2 border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-gray-900 shadow-xl hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300 font-bold"
        >
          Learn More
        </Button>
      </div>

      <!-- Trust Indicators -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in-up animation-delay-800" use:intersectionObserver={animateStats}>
        <div class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-primary-500/20 hover:border-primary-500/40 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 shadow-lg">
          <div class="flex items-center justify-center gap-3 mb-2">
            <Award size={24} class="text-primary-400" />
            <div class="text-3xl font-bold text-white">{animatedStats.farmers}+</div>
          </div>
          <div class="text-gray-300 font-medium">Happy Farmers</div>
        </div>
        <div class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-primary-500/20 hover:border-primary-500/40 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 shadow-lg">
          <div class="flex items-center justify-center gap-3 mb-2">
            <Leaf size={24} class="text-primary-400" />
            <div class="text-3xl font-bold text-white">{animatedStats.products}%</div>
          </div>
          <div class="text-gray-300 font-medium">Organic Solutions</div>
        </div>
        <div class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-primary-500/20 hover:border-primary-500/40 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 shadow-lg">
          <div class="flex items-center justify-center gap-3 mb-2">
            <Droplets size={24} class="text-primary-400" />
            <div class="text-3xl font-bold text-white">{animatedStats.water}%</div>
          </div>
          <div class="text-gray-300 font-medium">Water Savings</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Scroll Indicator -->
  <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
    <div class="w-6 h-10 border-2 border-primary-500/50 rounded-full flex justify-center">
      <div class="w-1 h-3 bg-primary-400 rounded-full mt-2 animate-scroll"></div>
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

<!-- CTA Section -->
<section class="mb-1 py-20 bg-primary-600 relative overflow-hidden">
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
      linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .bg-pattern {
    background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(20px, -50px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.9); }
    75% { transform: translate(50px, 50px) scale(1.05); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes fade-in-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scroll {
    0% { opacity: 0; transform: translateY(0); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: translateY(10px); }
  }

  .animate-blob {
    animation: blob 7s infinite;
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
  }

  .animate-scroll {
    animation: scroll 2s ease-in-out infinite;
  }

  .animation-delay-200 {
    animation-delay: 0.2s;
  }

  .animation-delay-400 {
    animation-delay: 0.4s;
  }

  .animation-delay-600 {
    animation-delay: 0.6s;
  }

  .animation-delay-800 {
    animation-delay: 0.8s;
  }

  .animation-delay-1000 {
    animation-delay: 1s;
  }

  .animation-delay-2000 {
    animation-delay: 2s;
  }

  .animation-delay-3000 {
    animation-delay: 3s;
  }

  .animation-delay-4000 {
    animation-delay: 4s;
  }
</style>
