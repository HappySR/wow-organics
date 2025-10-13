<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { Image, X } from 'lucide-svelte';

  let gallery = $state<any[]>([]);
  let loading = $state(true);
  let selectedImage = $state<any>(null);

  onMount(async () => {
    await loadGallery();
  });

  async function loadGallery() {
    loading = true;
    try {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) gallery = data;
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      loading = false;
    }
  }

  function openLightbox(image: any) {
    selectedImage = image;
  }

  function closeLightbox() {
    selectedImage = null;
  }
</script>

<svelte:head>
  <title>Gallery - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Our Gallery</h1>
      <p class="text-lg text-gray-600">Explore our innovative farming solutions in action</p>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array(9) as _}
          <div class="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
        {/each}
      </div>
    {:else if gallery.length === 0}
      <div class="text-center py-12">
        <Image size={64} class="mx-auto text-gray-400 mb-4" />
        <p class="text-gray-600">No images in gallery yet</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each gallery as item}
          <button
            onclick={() => openLightbox(item)}
            class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:shadow-xl transition-shadow"
          >
            {#if item.image_url}
              <img
                src={item.image_url}
                alt={item.title}
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center">
                <Image size={48} class="text-gray-400" />
              </div>
            {/if}
            
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h3 class="text-white font-semibold">{item.title}</h3>
                {#if item.description}
                  <p class="text-white/80 text-sm line-clamp-2">{item.description}</p>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Lightbox Modal -->
{#if selectedImage}
  <div
    class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    onclick={closeLightbox}
    onkeydown={(e) => e.key === 'Escape' && closeLightbox()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    >
    <button
      onclick={closeLightbox}
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
    >
      <X size={32} />
    </button>

    <button
      type="button"
      class="max-w-5xl w-full focus:outline-none"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === 'Escape') closeLightbox();
        e.stopPropagation();
      }}
      role="dialog"
      aria-label={selectedImage.title}
      tabindex="0"
      style="background: none; border: none; padding: 0;"
    >
      <img
        src={selectedImage.image_url}
        alt={selectedImage.title}
        class="w-full h-auto rounded-lg"
      />
      
      <div class="mt-4 text-white text-center">
        <h2 class="text-2xl font-bold mb-2">{selectedImage.title}</h2>
        {#if selectedImage.description}
          <p class="text-gray-300">{selectedImage.description}</p>
        {/if}
      </div>
    </button>
  </div>
{/if}
