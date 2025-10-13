<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { BookOpen, Users, Calendar } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Training Management - Admin</title>
</svelte:head>

<div class="p-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Training Programs</h1>
      <p class="text-gray-600 mt-2">Manage training sessions and participants</p>
    </div>
    <Button>Schedule New Training</Button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <Card>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Total Programs</p>
          <p class="text-3xl font-bold text-gray-900">12</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <BookOpen size={24} class="text-blue-600" />
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Active Participants</p>
          <p class="text-3xl font-bold text-gray-900">248</p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Users size={24} class="text-green-600" />
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 mb-1">Upcoming Sessions</p>
          <p class="text-3xl font-bold text-gray-900">5</p>
        </div>
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
          <Calendar size={24} class="text-purple-600" />
        </div>
      </div>
    </Card>
  </div>

  <Card>
    <div class="text-center py-12">
      <BookOpen size={64} class="mx-auto text-gray-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Training Management</h2>
      <p class="text-gray-600 mb-6">Training management features coming soon</p>
      <Button>Contact Support</Button>
    </div>
  </Card>
</div>
