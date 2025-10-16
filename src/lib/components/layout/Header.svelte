<script lang="ts">
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { Menu, ShoppingCart, User, LogOut, Package, Search, X, Home, Info, Box, Briefcase, GraduationCap, Image as ImageIcon, Star, Phone } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';

  let mobileMenuOpen = $state(false);
  let searchOpen = $state(false);
  let searchQuery = $state('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      goto(`/products?search=${encodeURIComponent(searchQuery)}`);
      searchOpen = false;
      searchQuery = '';
      mobileMenuOpen = false;
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    mobileMenuOpen = false;
    goto('/');
  };

  const navigateTo = (path: string) => {
    goto(path);
    mobileMenuOpen = false;
  };

  // Close mobile menu when clicking outside
  function handleBackdropClick() {
    mobileMenuOpen = false;
  }
</script>

<header class="sticky top-0 z-50 bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="flex items-center space-x-2">
          <div class="flex justify-center mb-1">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
              <img src="/logo/wow-sticker.png" alt="WOW! Organics Logo" class="w-full h-full object-cover" />
            </div>
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block">
            WOW! Organics
          </span>
        </a>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden lg:flex items-center space-x-8">
        <a href="/about" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">About</a>
        <a href="/products" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Products</a>
        <a href="/projects" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Projects</a>
        <a href="/training" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Training</a>
        <a href="/gallery" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Gallery</a>
        <a href="/reviews" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Reviews</a>
        <a href="/contact" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Contact</a>
      </nav>

      <!-- Desktop Actions -->
      <div class="hidden lg:flex items-center space-x-0">
        <button
          onclick={() => searchOpen = !searchOpen}
          class="p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        <a href="/cart" class="relative p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
          <ShoppingCart size={20} />
          {#if cart.totalItems > 0}
            <span class="absolute -top-1 -right-1 bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {cart.totalItems}
            </span>
          {/if}
        </a>

        {#if auth.isAuthenticated}
          <div class="relative group">
            <button 
              class="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
              onclick={(e) => { e.currentTarget.parentElement?.classList.toggle('active'); }}
            >
              <User size={20} />
              <span class="text-sm font-medium">{auth.profile?.full_name || 'Account'}</span>
            </button>

            <!-- Dropdown -->
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
              {#if auth.profile?.role === 'admin'}
                <a href="/admin" class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin Panel</span>
                </a>
              {/if}
              <a href="/orders" class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                <Package size={16} />
                <span>My Orders</span>
              </a>
              <button
                onclick={handleLogout}
                class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        {:else}
          <a href="/auth/login" class="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:from-primary-500 hover:to-primary-700 transition-all shadow-md hover:shadow-lg">
            Login
          </a>
        {/if}
      </div>

      <!-- Mobile Menu Button -->
      <div class="flex items-center space-x-2 lg:hidden">
        <a href="/cart" class="relative p-2 text-gray-700">
          <ShoppingCart size={20} />
          {#if cart.totalItems > 0}
            <span class="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cart.totalItems}
            </span>
          {/if}
        </a>
        <button
          onclick={() => mobileMenuOpen = !mobileMenuOpen}
          class="p-2 text-gray-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          {#if mobileMenuOpen}
            <X size={24} />
          {:else}
            <Menu size={24} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Desktop Search Bar -->
    {#if searchOpen}
      <div class="py-4 border-t" transition:fade={{ duration: 200 }}>
        <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex space-x-2">
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="Search products..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            class="px-6 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-white font-semibold rounded-lg hover:from-primary-500 hover:to-primary-700 transition-all shadow-md"
          >
            Search
          </button>
        </form>
      </div>
    {/if}
  </div>

  <!-- Mobile Sidebar Overlay -->
  {#if mobileMenuOpen}
    <button 
      type="button"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      onclick={handleBackdropClick}
      onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
      aria-label="Close menu"
      transition:fade={{ duration: 300 }}
    ></button>
  {/if}

  <!-- Mobile Sidebar -->
  {#if mobileMenuOpen}
    <div 
      class="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
      transition:fly={{ x: 320, duration: 300 }}
    >
      <div class="p-6">
        <!-- Close Button -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-2">
            <div class="flex justify-center mb-0">
              <div class="w-14 h-14 rounded-2xl mr-2 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
                <img src="/logo/wow-sticker.png" alt="WOW! Organics Logo" class="w-full h-full object-cover" />
              </div>
            </div>
            <span class="text-lg font-bold text-gray-900">Menu</span>
          </div>
          <button
            onclick={() => mobileMenuOpen = false}
            class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <!-- User Info (if logged in) -->
        {#if auth.isAuthenticated}
          <div class="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <User size={24} class="text-white" />
              </div>
              <div>
                <p class="font-semibold text-gray-900">{auth.profile?.full_name || 'User'}</p>
                <p class="text-sm text-gray-600">{auth.profile?.email}</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- Search -->
        <div class="mb-6">
          <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div class="relative">
              <input
                bind:value={searchQuery}
                type="text"
                placeholder="Search products..."
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search size={20} class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </form>
        </div>

        <!-- Navigation Links -->
        <nav class="space-y-2 mb-6">
          <button
            onclick={() => navigateTo('/')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Home size={20} />
            <span class="font-medium">Home</span>
          </button>
          <button
            onclick={() => navigateTo('/about')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Info size={20} />
            <span class="font-medium">About</span>
          </button>
          <button
            onclick={() => navigateTo('/products')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Box size={20} />
            <span class="font-medium">Products</span>
          </button>
          <button
            onclick={() => navigateTo('/projects')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Briefcase size={20} />
            <span class="font-medium">Projects</span>
          </button>
          <button
            onclick={() => navigateTo('/training')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <GraduationCap size={20} />
            <span class="font-medium">Training</span>
          </button>
          <button
            onclick={() => navigateTo('/gallery')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <ImageIcon size={20} />
            <span class="font-medium">Gallery</span>
          </button>
          <button
            onclick={() => navigateTo('/reviews')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Star size={20} />
            <span class="font-medium">Reviews</span>
          </button>
          <button
            onclick={() => navigateTo('/contact')}
            class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
          >
            <Phone size={20} />
            <span class="font-medium">Contact</span>
          </button>
        </nav>

        <div class="border-t border-gray-200 pt-4 space-y-2">
          {#if auth.isAuthenticated}
            {#if auth.profile?.role === 'admin'}
              <button
                onclick={() => navigateTo('/admin')}
                class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="font-medium">Admin Panel</span>
              </button>
            {/if}
            <button
              onclick={() => navigateTo('/orders')}
              class="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors"
            >
              <Package size={20} />
              <span class="font-medium">My Orders</span>
            </button>
            <button
              onclick={handleLogout}
              class="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span class="font-medium">Logout</span>
            </button>
          {:else}
            <button
              onclick={() => navigateTo('/auth/login')}
              class="w-full px-4 py-3 bg-gradient-to-r from-primary-400 to-primary-600 text-white font-semibold rounded-lg text-center hover:from-primary-500 hover:to-primary-700 transition-all shadow-md"
            >
              Login
            </button>
            <button
              onclick={() => navigateTo('/auth/register')}
              class="w-full px-4 py-3 border-2 border-primary-500 text-primary-600 font-semibold rounded-lg text-center hover:bg-primary-50 transition-colors"
            >
              Register
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</header>
