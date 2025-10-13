<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { Search, UserCheck, UserX, Users as UsersIcon, Shield, RefreshCw } from 'lucide-svelte';

  let users = $state<any[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    loading = true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      users = data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      loading = false;
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User role updated successfully');
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user role');
    }
  }

  const filteredUsers = $derived(
    users.filter(user =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const stats = $derived({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    customers: users.filter(u => u.role === 'customer').length
  });
</script>

<svelte:head>
  <title>Users Management - Admin</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
        <UsersIcon class="text-primary-600" size={32} />
        Users Management
      </h1>
      <p class="text-gray-600 mt-2">Manage user accounts and roles</p>
    </div>
    <button
      onclick={() => loadUsers()}
      class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all hover:shadow-md hover:scale-105"
    >
      <RefreshCw size={18} />
      Refresh
    </button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <Card class="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Total Users</p>
          <p class="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <UsersIcon size={24} class="text-blue-600" />
        </div>
      </div>
    </Card>

    <Card class="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Admins</p>
          <p class="text-3xl font-bold text-gray-900">{stats.admins}</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <Shield size={24} class="text-purple-600" />
        </div>
      </div>
    </Card>

    <Card class="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600 mb-1">Customers</p>
          <p class="text-3xl font-bold text-gray-900">{stats.customers}</p>
        </div>
        <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <UserCheck size={24} class="text-emerald-600" />
        </div>
      </div>
    </Card>
  </div>

  <!-- Search -->
  <Card class="border-0 shadow-md">
    <div class="flex items-center space-x-3">
      <Search size={20} class="text-gray-400 flex-shrink-0" />
      <Input
        bind:value={searchQuery}
        placeholder="Search users by name or email..."
        class="flex-1 border-0 focus:ring-0 bg-transparent"
      />
    </div>
  </Card>

  {#if loading}
    <Card class="border-0 shadow-lg">
      <div class="animate-pulse space-y-4">
        {#each Array(5) as _}
          <div class="h-16 bg-gray-200 rounded-lg"></div>
        {/each}
      </div>
    </Card>
  {:else}
    <Card padding="none" class="border-0 shadow-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr class="border-b border-gray-200">
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
              <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            {#each filteredUsers as user}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                      user.role === 'admin' 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{user.full_name || 'N/A'}</p>
                      <p class="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-700">{user.phone || 'N/A'}</span>
                </td>
                <td class="px-6 py-4">
                  <select
                    value={user.role}
                    onchange={(e) => updateUserRole(user.id, e.currentTarget.value)}
                    class={`text-xs font-bold px-4 py-2 rounded-lg border-2 transition-all hover:shadow-md ${
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-700">
                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex items-center justify-center">
                    {#if user.role === 'admin'}
                      <div class="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                        <Shield size={16} />
                        <span class="text-xs font-semibold">Admin</span>
                      </div>
                    {:else}
                      <div class="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                        <UserCheck size={16} />
                        <span class="text-xs font-semibold">Customer</span>
                      </div>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if filteredUsers.length === 0}
        <div class="text-center py-16">
          <UsersIcon size={64} class="text-gray-300 mx-auto mb-4" />
          <p class="text-gray-600 font-semibold text-lg">No users found</p>
          <p class="text-sm text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search query' : 'Users will appear here once they register'}
          </p>
        </div>
      {/if}
    </Card>
  {/if}
</div>
