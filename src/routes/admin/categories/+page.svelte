<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import type { Category } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { FolderTree, Edit, Trash2, Plus, Save, X } from 'lucide-svelte';

  let categories = $state<Category[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let showForm = $state(false);
  let editingId = $state<string | null>(null);

  let formData = $state({
    name: '',
    slug: '',
    description: '',
    parent_id: null as string | null
  });

  onMount(async () => {
    if (!auth.isAdmin) {
      toast.error('Admin access required');
      return;
    }
    await loadCategories();
  });

  async function loadCategories() {
    loading = true;
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      categories = data || [];
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      loading = false;
    }
  }

  function generateSlug() {
    if (!formData.name) return;
    formData.slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function startEdit(category: Category) {
    editingId = category.id;
    formData = {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id
    };
    showForm = true;
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    formData = {
      name: '',
      slug: '',
      description: '',
      parent_id: null
    };
    editingId = null;
    showForm = false;
  }

  async function handleSubmit() {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    saving = true;
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        // Insert
        const { error } = await supabase
          .from('categories')
          .insert([formData]);

        if (error) throw error;
        toast.success('Category created successfully');
      }

      await loadCategories();
      resetForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        toast.error('A category with this name or slug already exists');
      } else {
        toast.error('Failed to save category');
      }
    } finally {
      saving = false;
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all its subcategories and may affect products.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted successfully');
      await loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      if (error.code === '23503') {
        toast.error('Cannot delete: This category is used by products or has subcategories');
      } else {
        toast.error('Failed to delete category');
      }
    }
  }

  const parentCategories = $derived(categories.filter(c => !c.parent_id));
</script>

<svelte:head>
  <title>Category Management - Admin</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <FolderTree class="text-primary-600" size={32} />
        Category Management
      </h1>
      <p class="text-gray-600 mt-2">Organize your product catalog</p>
    </div>
    <Button onclick={() => showForm = !showForm}>
      {#if showForm}
        <X size={20} class="mr-2" />
        Cancel
      {:else}
        <Plus size={20} class="mr-2" />
        Add Category
      {/if}
    </Button>
  </div>

  <!-- Form -->
  {#if showForm}
    <Card class="border-0 shadow-lg">
      <h2 class="text-xl font-bold text-gray-900 mb-6">
        {editingId ? 'Edit Category' : 'Add New Category'}
      </h2>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
        <div>
          <label for="category_name" class="block text-sm font-semibold text-gray-700 mb-2">
            Category Name <span class="text-red-500">*</span>
          </label>
          <Input
            id="category_name"
            bind:value={formData.name}
            onblur={generateSlug}
            placeholder="e.g., Grow Bags"
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
            placeholder="grow-bags"
            required
          />
          <p class="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
        </div>

        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Brief description of this category"
          ></textarea>
        </div>

        <div>
          <label for="parent_category" class="block text-sm font-semibold text-gray-700 mb-2">
            Parent Category
          </label>
          <select
            id="parent_category"
            bind:value={formData.parent_id}
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={null}>None (Top Level)</option>
            {#each parentCategories as category}
              {#if category.id !== editingId}
                <option value={category.id}>{category.name}</option>
              {/if}
            {/each}
          </select>
        </div>

        <div class="flex gap-3">
          <Button type="submit" loading={saving}>
            <Save size={20} class="mr-2" />
            {editingId ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onclick={resetForm}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  {/if}

  <!-- Categories List -->
  <Card padding="none" class="border-0 shadow-lg overflow-hidden">
    {#if loading}
      <div class="p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    {:else if categories.length === 0}
      <div class="p-12 text-center">
        <FolderTree size={64} class="text-gray-300 mx-auto mb-4" />
        <p class="text-gray-600 font-semibold text-lg">No categories yet</p>
        <p class="text-sm text-gray-500 mt-2">Create your first category to get started</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr class="border-b border-gray-200">
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Slug</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Parent</th>
              <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            {#each categories as category}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-semibold text-gray-900">{category.name}</p>
                  {#if category.description}
                    <p class="text-sm text-gray-600">{category.description}</p>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <code class="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{category.slug}</code>
                </td>
                <td class="px-6 py-4">
                  {#if category.parent_id}
                    {@const parent = categories.find(c => c.id === category.parent_id)}
                    <span class="text-sm text-gray-600">{parent?.name || '-'}</span>
                  {:else}
                    <span class="text-sm text-gray-500 italic">Top Level</span>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      onclick={() => startEdit(category)}
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onclick={() => deleteCategory(category.id, category.name)}
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</div>
