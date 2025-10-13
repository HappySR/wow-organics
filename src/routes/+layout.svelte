<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-svelte';
  import '../app.css';

  let { children } = $props();
  let initializing = $state(true);

  onMount(async () => {
    if (browser) {
      await auth.initialize();
      
      if (auth.isAuthenticated && auth.user) {
        await cart.loadCart(auth.user.id);
      }
      
      initializing = false;
    }
  });

  const toastIcons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  };

  const toastColors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };
</script>

<div class="min-h-screen flex flex-col">
  <Header />
  
  <main class="flex-1">
    {@render children()}
  </main>
  
  <Footer />

  <!-- Toast Notifications -->
  <div class="fixed bottom-4 right-4 z-50 space-y-2">
    {#each toast.toasts as toastItem (toastItem.id)}
      {@const Icon = toastIcons[toastItem.type]}
      <div
        class={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${toastColors[toastItem.type]} animate-slide-in-right`}
      >
        <Icon size={20} />
        <p class="flex-1">{toastItem.message}</p>
        <button
          onclick={() => toast.remove(toastItem.id)}
          class="hover:opacity-70 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
</style>
