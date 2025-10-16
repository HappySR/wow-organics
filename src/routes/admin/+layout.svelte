<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { 
    LayoutDashboard, Package, ShoppingCart, Users, BookOpen, 
    Image, Settings, LogOut, Menu, X, ChevronLeft 
  } from 'lucide-svelte';

  let { children } = $props();
  
  let sidebarCollapsed = $state(false);
  let mobileMenuOpen = $state(false);

  onMount(() => {
    // Restore sidebar state
    const savedState = localStorage.getItem('admin_sidebar_collapsed');
    if (savedState) {
      sidebarCollapsed = savedState === 'true';
    }

    // Check auth - redirect if not admin
    if (!auth.isAuthenticated || auth.profile?.role !== 'admin') {
      goto(`/auth/login?redirect=${encodeURIComponent($page.url.pathname)}`);
    }
  });

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Training', href: '/admin/training', icon: BookOpen },
    { label: 'Gallery', href: '/admin/gallery', icon: Image },
    { label: 'Settings', href: '/admin/settings', icon: Settings }
  ];

  function isActive(href: string): boolean {
    if (href === '/admin') {
      return $page.url.pathname === '/admin';
    }
    return $page.url.pathname.startsWith(href);
  }

  async function handleLogout() {
    try {
      await auth.signOut();
      goto('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem('admin_sidebar_collapsed', String(sidebarCollapsed));
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<svelte:head>
  <style>
    :global(body) {
      overflow-x: hidden;
    }
  </style>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
  <!-- Mobile Header -->
  <div class="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
    <div class="flex items-center space-x-2">
      <div class="flex justify-center mb-1">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
          <img src="/logo/wow-sticker.png" alt="WOW! Organics Logo" class="w-full h-full object-cover" />
        </div>
      </div>
      <span class="font-bold text-gray-900">Admin Panel</span>
    </div>
    <button
      onclick={toggleMobileMenu}
      class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Toggle menu"
    >
      {#if mobileMenuOpen}
        <X size={24} />
      {:else}
        <Menu size={24} />
      {/if}
    </button>
  </div>

  <!-- Mobile Menu Overlay -->
  {#if mobileMenuOpen}
    <button
      type="button"
      class="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      onclick={closeMobileMenu}
      aria-label="Close menu"
      tabindex="0"
    ></button>
  {/if}

  <!-- Sidebar -->
  <aside 
    class={`
      fixed top-0 left-0 h-full bg-white border-r border-gray-200 
      flex flex-col shadow-xl transition-all duration-300 ease-in-out z-50
      ${sidebarCollapsed ? 'w-20' : 'w-72'}
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
  >
    <!-- Logo Section -->
    <div class="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-gradient-to-r from-primary-50 to-white">
      <div class={`flex items-center space-x-3 transition-opacity ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
        <div class="flex justify-center mb-1">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300 overflow-hidden">
            <img src="/logo/wow-sticker.png" alt="WOW! Organics Logo" class="w-full h-full object-cover" />
          </div>
        </div>
        {#if !sidebarCollapsed}
          <div>
            <h1 class="font-bold text-gray-900 text-sm">WOW! Organics</h1>
            <p class="text-xs text-primary-600 font-medium">Admin Panel</p>
          </div>
        {/if}
      </div>
      
      <button
        onclick={toggleSidebar}
        class="hidden lg:flex p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft size={20} class={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
      {#each navItems as item}
        {@const Icon = item.icon}
        <a
          href={item.href}
          onclick={closeMobileMenu}
          class={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all
            group relative overflow-hidden
            ${isActive(item.href)
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30' + (sidebarCollapsed ? ' pl-7' : '')
              : 'text-gray-700 hover:bg-gray-100 hover:scale-[1.02]'}
            ${sidebarCollapsed ? 'justify-center' : ''}`
          }
          title={sidebarCollapsed ? item.label : ''}
        >
          <div class={`flex items-center justify-center ${sidebarCollapsed ? 'w-full' : ''}`}>
            <Icon 
              size={22} 
              class="flex-shrink-0 transition-transform duration-200" 
            />
          </div>
          {#if !sidebarCollapsed}
            <span class="font-medium text-sm">{item.label}</span>
          {/if}
          
          {#if isActive(item.href)}
            <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- User Profile Section -->
    <div class="p-3 border-t border-gray-200 bg-gray-50">
      <div class={`flex items-center space-x-3 px-4 py-3 mb-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div class="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center ring-2 ring-primary-500/20 flex-shrink-0">
          <span class="text-primary-700 font-semibold text-sm">
            {auth.profile?.full_name?.charAt(0) || 'A'}
          </span>
        </div>
        {#if !sidebarCollapsed}
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 truncate">{auth.profile?.full_name || 'Admin'}</p>
            <p class="text-xs text-primary-600 capitalize font-medium">{auth.profile?.role || 'admin'}</p>
          </div>
        {/if}
      </div>
      
      <button
        onclick={handleLogout}
        class={`
          flex items-center space-x-3 w-full px-4 py-3 rounded-xl 
          text-red-600 hover:bg-red-50 transition-all hover:scale-[1.02]
          font-medium text-sm
          ${sidebarCollapsed ? 'justify-center' : ''}
        `}
        title={sidebarCollapsed ? 'Logout' : ''}
        aria-label="Logout"
      >
        <LogOut size={20} class={sidebarCollapsed ? '' : 'flex-shrink-0'} />
        {#if !sidebarCollapsed}
          <span>Logout</span>
        {/if}
      </button>
    </div>
  </aside>

  <!-- Main Content -->
  <main 
    class={`
      transition-all duration-300 ease-in-out
      min-h-screen pt-16 lg:pt-0
      ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
    `}
  >
    {@render children()}
  </main>
</div>
