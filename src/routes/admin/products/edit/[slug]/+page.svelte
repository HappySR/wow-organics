<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency } from '$lib/utils/helpers';
  import { auth } from '$lib/stores/auth.svelte';
  import { requireAdmin } from '$lib/utils/guards';
  import type { Product, Category } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { Package, Save, ArrowLeft, Upload, X } from 'lucide-svelte';

  // Get product slug from URL params
  const slug = $page.params.slug;

  let product = $state<Product | null>(null);
  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let uploadingImage = $state(false);

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
    image_url: '',
    specifications: {}
  });

  // Specifications as array for easier editing
  let specs = $state<{ key: string; value: string }[]>([]);

  onMount(async () => {
    await loadCategories();
    await loadProduct();
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

  async function loadProduct() {
    loading = true;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      
      if (data) {
        product = data;
        
        // Populate form data
        formData = {
          name: data.name || '',
          slug: data.slug || '',
          category_id: data.category_id || '',
          description: data.description || '',
          base_price: data.base_price || 0,
          gst_percentage: data.gst_percentage || 18,
          transport_charges: data.transport_charges || 0,
          stock_quantity: data.stock_quantity || 0,
          is_custom: data.is_custom || false,
          is_active: data.is_active !== false,
          image_url: data.image_url || '',
          specifications: data.specifications || {}
        };

        // Convert specifications object to array
        if (data.specifications && typeof data.specifications === 'object') {
          specs = Object.entries(data.specifications).map(([key, value]) => ({
            key,
            value: String(value)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
      goto('/admin/products');
    } finally {
      loading = false;
    }
  }

  async function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    uploadingImage = true;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      formData.image_url = publicUrl;
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      uploadingImage = false;
    }
  }

  function addSpecification() {
    specs = [...specs, { key: '', value: '' }];
  }

  function removeSpecification(index: number) {
    specs = specs.filter((_, i) => i !== index);
  }

  function generateSlug() {
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

      const updateData = {
        ...formData,
        specifications: specificationsObj,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product?.id);

      if (error) throw error;

      toast.success('Product updated successfully');
      goto('/admin/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      
      // Handle unique constraint errors
      if (error.code === '23505') {
        if (error.message.includes('slug')) {
          toast.error('A product with this slug already exists');
        } else {
          toast.error('A product with these details already exists');
        }
      } else {
        toast.error('Failed to update product');
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
  <title>Edit Product - {product?.name || 'Loading...'}</title>
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
          Edit Product
        </h1>
        <p class="text-gray-600 mt-1">Update product information</p>
      </div>
    </div>
  </div>

  {#if loading}
    <Card class="border-0 shadow-lg">
      <div class="animate-pulse space-y-6">
        <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        <div class="h-48 bg-gray-200 rounded"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        <div class="h-32 bg-gray-200 rounded"></div>
      </div>
    </Card>
  {:else if product}
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

      <!-- Product Image -->
      <Card class="border-0 shadow-lg">
        <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div class="w-2 h-8 bg-blue-600 rounded-full"></div>
          Product Image
        </h2>

        <div class="space-y-4">
          {#if formData.image_url}
            <div class="relative w-full max-w-md">
              <img
                src={formData.image_url}
                alt={formData.name}
                class="w-full h-64 object-cover rounded-xl border-2 border-gray-200 shadow-md"
              />
              <button
                type="button"
                onclick={() => formData.image_url = ''}
                class="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          {/if}

          <div class="flex items-center gap-4">
            <label class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-all hover:shadow-md">
              <Upload size={20} />
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                onchange={handleImageUpload}
                disabled={uploadingImage}
                class="hidden"
              />
            </label>
            {#if uploadingImage}
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            {/if}
          </div>
          <p class="text-sm text-gray-500">Max size: 5MB. Supported formats: JPG, PNG, WebP</p>
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
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  {:else}
    <Card class="border-0 shadow-lg">
      <div class="text-center py-16">
        <Package size={64} class="text-gray-300 mx-auto mb-4" />
        <p class="text-gray-600 font-semibold text-lg">Product not found</p>
      </div>
    </Card>
  {/if}
</div>
