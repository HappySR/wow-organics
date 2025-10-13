<script lang="ts">
  import { X } from 'lucide-svelte';

  interface Props {
    open?: boolean;
    title?: string;
    onClose?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children?: any;
  }

  let {
    open = $bindable(false),
    title,
    onClose,
    size = 'md',
    children
  }: Props = $props();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  function handleClose() {
    open = false;
    onClose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    onclick={handleBackdropClick}
    onkeydown={(e) => e.key === 'Escape' && handleClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    >
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50 transition-opacity"></div>
      
      <div class={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all`}>
        <!-- Header -->
        {#if title}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onclick={handleClose}
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        {:else}
          <button
            onclick={handleClose}
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={24} />
          </button>
        {/if}

        <!-- Content -->
        <div class="p-6">
          {@render children?.()}
        </div>
      </div>
    </div>
  </div>
{/if}
