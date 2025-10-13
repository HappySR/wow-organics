<script lang="ts">
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { Menu, ShoppingCart, User, LogOut, Package, Search, X } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let mobileMenuOpen = $state(false);
  let searchOpen = $state(false);
  let searchQuery = $state('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      goto(`/products?search=${encodeURIComponent(searchQuery)}`);
      searchOpen = false;
      searchQuery = '';
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    goto('/');
  };
</script>

<header class="sticky top-0 z-50 bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <a href="/" class="flex items-center space-x-2">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-black font-bold text-xl">W!</span>
          </div>
          <span class="text-xl font-bold text-gray-900 hidden sm:block">WOW! Organics</span>
        </a>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        <a href="/about" class="text-gray-700 hover:text-primary-600 transition-colors">About</a>
        <a href="/products" class="text-gray-700 hover:text-primary-600 transition-colors">Products</a>
        <a href="/projects" class="text-gray-700 hover:text-primary-600 transition-colors">Projects</a>
        <a href="/training" class="text-gray-700 hover:text-primary-600 transition-colors">Training</a>
        <a href="/gallery" class="text-gray-700 hover:text-primary-600 transition-colors">Gallery</a>
        <a href="/reviews" class="text-gray-700 hover:text-primary-600 transition-colors">Reviews</a>
      </nav>

      <!-- Desktop Actions -->
      <div class="hidden md:flex items-center space-x-4">
        <button
          onclick={() => searchOpen = !searchOpen}
          class="text-gray-700 hover:text-primary-600 transition-colors"
        >
          <Search size={20} />
        </button>

        <a href="/cart" class="relative text-gray-700 hover:text-primary-600 transition-colors">
          <ShoppingCart size={20} />
          {#if cart.totalItems > 0}
            <span class="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.totalItems}
            </span>
          {/if}
        </a>

        {#if auth.isAuthenticated}
          <div class="relative group">
          <button class="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors">
            <User size={20} />
            <span class="text-sm">{auth.profile?.full_name || 'Account'}</span>
          </button>

          <!-- Dropdown -->
          <div
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
          >
            <a href="/orders" class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
              <Package size={16} />
              <span>My Orders</span>
            </a>
            <button
              onclick={handleLogout}
              class="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
        {:else}
          <a href="/auth/login" class="text-primary-600 hover:text-primary-700 transition-colors font-medium">
            Login
          </a>
        {/if}
      </div>

      <!-- Mobile Menu Button -->
      <button
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
        class="md:hidden text-gray-700"
      >
        {#if mobileMenuOpen}
          <X size={24} />
        {:else}
          <Menu size={24} />
        {/if}
      </button>
    </div>

    <!-- Search Bar -->
    {#if searchOpen}
      <div class="py-4 border-t">
        <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex space-x-2">
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="Search products..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>
    {/if}
  </div>

  <!-- Mobile Menu -->
  {#if mobileMenuOpen}
    <div class="md:hidden border-t bg-white">
      <nav class="px-4 py-4 space-y-4">
        <a href="/about" class="block text-gray-700 hover:text-primary-600">About</a>
        <a href="/products" class="block text-gray-700 hover:text-primary-600">Products</a>
        <a href="/projects" class="block text-gray-700 hover:text-primary-600">Projects</a>
        <a href="/training" class="block text-gray-700 hover:text-primary-600">Training</a>
        <a href="/gallery" class="block text-gray-700 hover:text-primary-600">Gallery</a>
        <a href="/reviews" class="block text-gray-700 hover:text-primary-600">Reviews</a>
        
        {#if auth.isAuthenticated}
          <a href="/orders" class="block text-gray-700 hover:text-primary-600">My Orders</a>
          <button
            onclick={handleLogout}
            class="block text-gray-700 hover:text-primary-600 text-left"
          >
            Logout
          </button>
        {:else}
          <a href="/auth/login" class="block text-primary-600 font-medium">Login</a>
          <a href="/auth/register" class="block text-primary-600 font-medium">Register</a>
        {/if}
      </nav>
    </div>
  {/if}
</header>
