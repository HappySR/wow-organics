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
          <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
            <span class="text-gray-900 font-bold text-xl">W!</span>
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block">WOW! Organics</span>
        </a>
      </div>

      <!-- Desktop Navigation -->
      <nav class="hidden md:flex items-center space-x-8">
        <a href="/about" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">About</a>
        <a href="/products" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Products</a>
        <a href="/projects" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Projects</a>
        <a href="/training" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Training</a>
        <a href="/gallery" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Gallery</a>
        <a href="/reviews" class="text-gray-700 hover:text-primary-600 font-medium transition-colors">Reviews</a>
      </nav>

      <!-- Desktop Actions -->
      <div class="hidden md:flex items-center space-x-4">
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
            <span class="absolute top-0 right-0 bg-gradient-to-br from-primary-400 to-primary-600 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {cart.totalItems}
            </span>
          {/if}
        </a>

        {#if auth.isAuthenticated}
          <div class="relative group">
            <button class="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
              <User size={20} />
              <span class="text-sm font-medium">{auth.profile?.full_name || 'Account'}</span>
            </button>

            <!-- Dropdown -->
            <div
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
            >
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
          <a href="/auth/login" class="px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-gray-900 font-semibold rounded-lg hover:from-primary-500 hover:to-primary-700 transition-all shadow-md hover:shadow-lg">
            Login
          </a>
        {/if}
      </div>

      <!-- Mobile Menu Button -->
      <button
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
        class="md:hidden p-2 text-gray-700 hover:bg-primary-50 rounded-lg"
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
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            class="px-6 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-gray-900 font-semibold rounded-lg hover:from-primary-500 hover:to-primary-700 transition-all shadow-md"
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
      <nav class="px-4 py-4 space-y-2">
        <a href="/about" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">About</a>
        <a href="/products" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">Products</a>
        <a href="/projects" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">Projects</a>
        <a href="/training" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">Training</a>
        <a href="/gallery" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">Gallery</a>
        <a href="/reviews" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">Reviews</a>
        
        {#if auth.isAuthenticated}
          <a href="/orders" class="block px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors">My Orders</a>
          <button
            onclick={handleLogout}
            class="block w-full text-left px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            Logout
          </button>
        {:else}
          <a href="/auth/login" class="block px-3 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-gray-900 font-semibold rounded-lg text-center">Login</a>
          <a href="/auth/register" class="block px-3 py-2 border-2 border-primary-500 text-primary-600 font-semibold rounded-lg text-center hover:bg-primary-50">Register</a>
        {/if}
      </nav>
    </div>
  {/if}
</header>
