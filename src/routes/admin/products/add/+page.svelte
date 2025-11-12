<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency } from '$lib/utils/helpers';
  import { auth } from '$lib/stores/auth.svelte';
  import type { Category } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { Package, Save, ArrowLeft, Upload, X, Plus, Image as ImageIcon, Video } from 'lucide-svelte';

  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let uploadingMedia = $state(false);
  let checkingAuth = $state(true);
  let fullscreenMedia = $state<{ type: 'image' | 'video'; url: string } | null>(null);

  // Form fields
  let formData = $state({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    base_price: 0,
    gst_percentage: 18,
    transport_charges: 0,
    stock_quantity: 0,
    is_custom: false,
    is_active: true,
    image_url: '', // Keep for backward compatibility
  });

  // Media files
  let mediaFiles = $state<{ type: 'image' | 'video'; url: string; file?: File }[]>([]);

  // Specifications as array for easier editing
  let specs = $state<{ key: string; value: string }[]>([]);

  onMount(async () => {
    // Wait for auth to initialize
    let attempts = 0;
    while (auth.loading && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Check if user is admin
    if (!auth.isAuthenticated || !auth.isAdmin) {
      toast.error('You need admin access to add products');
      goto('/admin/products');
      return;
    }

    checkingAuth = false;
    await loadCategories();
    loading = false;
  });

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) categories = data;
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  }

  async function handleMediaUpload(event: Event, mediaType: 'image' | 'video') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = mediaType === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`${mediaType === 'image' ? 'Image' : 'Video'} size should be less than ${mediaType === 'image' ? '10MB' : '50MB'}`);
      return;
    }

    uploadingMedia = true;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `product-${mediaType}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      mediaFiles = [...mediaFiles, { type: mediaType, url: publicUrl }];
      
      // Set first image as primary image_url for backward compatibility
      if (mediaType === 'image' && !formData.image_url) {
        formData.image_url = publicUrl;
      }
      
      toast.success(`${mediaType === 'image' ? 'Image' : 'Video'} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${mediaType}:`, error);
      toast.error(`Failed to upload ${mediaType}`);
    } finally {
      uploadingMedia = false;
      // Reset input
      input.value = '';
    }
  }

  function removeMedia(index: number) {
    const removedMedia = mediaFiles[index];
    mediaFiles = mediaFiles.filter((_, i) => i !== index);
    
    // Update primary image_url if removed
    if (removedMedia.url === formData.image_url) {
      const firstImage = mediaFiles.find(m => m.type === 'image');
      formData.image_url = firstImage?.url || '';
    }
  }

  function viewFullscreen(media: { type: 'image' | 'video'; url: string }) {
    fullscreenMedia = media;
  }

  function closeFullscreen() {
    fullscreenMedia = null;
  }

  function addSpecification() {
    specs = [...specs, { key: '', value: '' }];
  }

  function removeSpecification(index: number) {
    specs = specs.filter((_, i) => i !== index);
  }

  function generateSlug() {
    if (!formData.name) return;
    formData.slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleSubmit() {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Product slug is required');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please select a category');
      return;
    }

    if (formData.base_price <= 0) {
      toast.error('Base price must be greater than 0');
      return;
    }

    saving = true;
    try {
      // Convert specs array back to object
      const specificationsObj: Record<string, string> = {};
      specs.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsObj[spec.key.trim()] = spec.value.trim();
        }
      });

      const insertData = {
        ...formData,
        specifications: specificationsObj,
      };

      const { data: product, error } = await supabase
        .from('products')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Insert media files
      if (mediaFiles.length > 0 && product) {
        const mediaInserts = mediaFiles.map((media, index) => ({
          product_id: product.id,
          media_type: media.type,
          media_url: media.url,
          display_order: index,
          is_primary: index === 0
        }));

        const { error: mediaError } = await supabase
          .from('product_media')
          .insert(mediaInserts);

        if (mediaError) {
          console.error('Error inserting media:', mediaError);
          toast.error('Product created but some media failed to save');
        }
      }

      toast.success('Product created successfully');
      goto('/admin/products');
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Handle unique constraint errors
      if (error.code === '23505') {
        if (error.message.includes('slug')) {
          toast.error('A product with this slug already exists');
        } else {
          toast.error('A product with these details already exists');
        }
      } else {
        toast.error('Failed to create product');
      }
    } finally {
      saving = false;
    }
  }

  const calculatedPrice = $derived({
    basePrice: formData.base_price,
    gstAmount: (formData.base_price * formData.gst_percentage) / 100,
    transportCharges: formData.transport_charges,
    get total() {
      return this.basePrice + this.gstAmount + this.transportCharges;
    }
  });
</script>

<svelte:head>
  <title>Add Product - Admin</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button
        onclick={() => goto('/admin/products')}
        class="inline-flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <ArrowLeft size={20} />
      </button>
      <div>
        <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Package class="text-primary-600" size={32} />
          Add New Product
        </h1>
        <p class="text-gray-600 mt-1">Create a new product in your catalog</p>
      </div>
    </div>
  </div>

  {#if checkingAuth || loading}
    <Card class="border-0 shadow-lg">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        <div class="h-48 bg-gray-200 rounded"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        <div class="h-32 bg-gray-200 rounded"></div>
      </div>
    </Card>
  {:else}
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
      <!-- Basic Information -->
      <Card class="border-0 shadow-lg">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div class="w-2 h-8 bg-primary-600 rounded-full"></div>
          Basic Information
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <label for="product-name" class="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span class="text-red-500">*</span>
            </label>
            <Input
              id="product-name"
              bind:value={formData.name}
              onblur={generateSlug}
              placeholder="Enter product name"
              required
            />
          </div>

          <div>
            <label for="slug" class="block text-sm font-semibold text-gray-700 mb-2">
              Slug <span class="text-red-500">*</span>
            </label>
            <Input
              id="slug"
              bind:value={formData.slug}
              placeholder="product-slug"
              required
            />
            <p class="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
          </div>

          <div>
            <label for="category" class="block text-sm font-semibold text-gray-700 mb-2">
              Category <span class="text-red-500">*</span>
            </label>
            <select
              id="category"
              bind:value={formData.category_id}
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>

          <div class="md:col-span-2">
            <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              bind:value={formData.description}
              rows="4"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Enter product description"
            ></textarea>
          </div>
        </div>
      </Card>

      <!-- Pricing -->
      <Card class="border-0 shadow-lg">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div class="w-2 h-8 bg-emerald-600 rounded-full"></div>
          Pricing & Stock
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="base-price" class="block text-sm font-semibold text-gray-700 mb-2">
              Base Price (₹) <span class="text-red-500">*</span>
            </label>
            <Input
              id="base-price"
              type="number"
              bind:value={formData.base_price}
              min={0}
              step={0.01}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label for="gst-percentage" class="block text-sm font-semibold text-gray-700 mb-2">
              GST Percentage (%)
            </label>
            <Input
              id="gst-percentage"
              type="number"
              bind:value={formData.gst_percentage}
              min={0}
              max={100}
              step={0.01}
              placeholder="18.00"
            />
          </div>

          <div>
            <label for="transport-charges" class="block text-sm font-semibold text-gray-700 mb-2">
              Transport Charges (₹)
            </label>
            <Input
              id="transport-charges"
              type="number"
              bind:value={formData.transport_charges}
              min={0}
              step={0.01}
              placeholder="0.00"
            />
          </div>

          <div>
            <label for="stock-quantity" class="block text-sm font-semibold text-gray-700 mb-2">
              Stock Quantity
            </label>
            <Input
              id="stock-quantity"
              type="number"
              bind:value={formData.stock_quantity}
              min={0}
              placeholder="0"
            />
          </div>

          <!-- Price Calculation -->
          <div class="md:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h3 class="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Base Price:</span>
                <span class="font-semibold text-gray-900">{formatCurrency(calculatedPrice.basePrice)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">GST ({formData.gst_percentage}%):</span>
                <span class="font-semibold text-gray-900">{formatCurrency(calculatedPrice.gstAmount)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Transport Charges:</span>
                <span class="font-semibold text-gray-900">{formatCurrency(calculatedPrice.transportCharges)}</span>
              </div>
              <div class="pt-3 border-t-2 border-gray-300">
                <div class="flex justify-between">
                  <span class="font-bold text-gray-900">Final Price:</span>
                  <span class="font-bold text-xl text-primary-600">{formatCurrency(calculatedPrice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Product Media -->
      <Card class="border-0 shadow-lg">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div class="w-2 h-8 bg-blue-600 rounded-full"></div>
          Product Media (Images & Videos)
        </h2>

        <div class="space-y-6">
          <!-- Media Grid -->
          {#if mediaFiles.length > 0}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {#each mediaFiles as media, index}
                <div class="relative group">
                  <button
                    type="button"
                    onclick={() => viewFullscreen(media)}
                    class="aspect-square rounded-xl border-2 border-gray-200 shadow-md overflow-hidden bg-gray-100 w-full cursor-pointer hover:border-primary-500 transition-colors"
                  >
                    {#if media.type === 'image'}
                      <img src={media.url} alt="Product media {index + 1}" class="w-full h-full object-cover" />
                    {:else if media.type === 'video'}
                      <video src={media.url} class="w-full h-full object-cover">
                        <track kind="captions" />
                      </video>
                    {:else}
                      <div class="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video size={48} class="text-white" />
                      </div>
                    {/if}
                  </button>
                  <button
                    type="button"
                    onclick={() => removeMedia(index)}
                    class="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors opacity-100 z-10"
                  >
                    <X size={16} />
                  </button>
                  <div class="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                    {media.type === 'image' ? 'Image' : 'Video'} {index + 1}
                  </div>
                  {#if index === 0}
                    <div class="absolute top-2 left-2 px-2 py-1 bg-primary-600 text-white text-xs rounded font-semibold">
                      Primary
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <!-- Upload Buttons -->
          <div class="flex flex-wrap items-center gap-4">
            <label class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              <ImageIcon size={20} />
              {uploadingMedia ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                onchange={(e) => handleMediaUpload(e, 'image')}
                disabled={uploadingMedia}
                class="hidden"
              />
            </label>
            
            <label class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg cursor-pointer transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              <Video size={20} />
              {uploadingMedia ? 'Uploading...' : 'Upload Video'}
              <input
                type="file"
                accept="video/*"
                onchange={(e) => handleMediaUpload(e, 'video')}
                disabled={uploadingMedia}
                class="hidden"
              />
            </label>
            
            {#if uploadingMedia}
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            {/if}
          </div>
          
          <div class="text-sm text-gray-500 space-y-1">
            <p>• Images: Max 10MB each (JPG, PNG, WebP)</p>
            <p>• Videos: Max 50MB each (MP4, WebM)</p>
            <p>• First media will be set as primary</p>
            <p>• Drag to reorder (coming soon)</p>
          </div>
        </div>
      </Card>

      <!-- Specifications -->
      <Card class="border-0 shadow-lg">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div class="w-2 h-8 bg-purple-600 rounded-full"></div>
            Specifications
          </h2>
          <Button type="button" onclick={addSpecification} size="sm">
            <Plus size={16} class="mr-1" />
            Add Specification
          </Button>
        </div>

        <div class="space-y-4">
          {#each specs as spec, index}
            <div class="flex gap-4 items-start">
              <div class="flex-1">
                <Input
                  bind:value={spec.key}
                  placeholder="Key (e.g., Material)"
                />
              </div>
              <div class="flex-1">
                <Input
                  bind:value={spec.value}
                  placeholder="Value (e.g., Stainless Steel)"
                />
              </div>
              <button
                type="button"
                onclick={() => removeSpecification(index)}
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
              >
                <X size={20} />
              </button>
            </div>
          {/each}

          {#if specs.length === 0}
            <p class="text-center text-gray-500 py-8">
              No specifications added. Click "Add Specification" to add one.
            </p>
          {/if}
        </div>
      </Card>

      <!-- Settings -->
      <Card class="border-0 shadow-lg">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div class="w-2 h-8 bg-orange-600 rounded-full"></div>
          Settings
        </h2>

        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              bind:checked={formData.is_active}
              class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <span class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Active</span>
              <p class="text-sm text-gray-500">Make this product visible to customers</p>
            </div>
          </label>

          <label class="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              bind:checked={formData.is_custom}
              class="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <span class="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Custom Product</span>
              <p class="text-sm text-gray-500">This product can be customized by customers</p>
            </div>
          </label>
        </div>
      </Card>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="secondary"
          onclick={() => goto('/admin/products')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Save size={20} class="mr-2" />
          {saving ? 'Creating...' : 'Create Product'}
        </Button>
      </div>
    </form>
  {/if}

  <!-- Fullscreen Media Modal -->
  {#if fullscreenMedia}
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen media view"
      tabindex="-1"
      class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onclick={closeFullscreen}
      onkeydown={(e) => e.key === 'Escape' && closeFullscreen()}
    >
      <button
        type="button"
        onclick={closeFullscreen}
        aria-label="Close fullscreen view"
        class="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors z-10"
      >
        <X size={24} />
      </button>
      
      <button 
        type="button"
        class="max-w-7xl max-h-full bg-transparent border-0 p-0 cursor-default" 
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
      >
        {#if fullscreenMedia.type === 'image'}
          <img 
            src={fullscreenMedia.url} 
            alt="Fullscreen view" 
            class="max-w-full max-h-[90vh] object-contain"
          />
        {:else if fullscreenMedia.type === 'video'}
          <video 
            src={fullscreenMedia.url} 
            controls 
            autoplay
            class="max-w-full max-h-[90vh] object-contain"
          >
            <track kind="captions" />
          </video>
        {/if}
      </button>
    </div>
  {/if}
</div>
