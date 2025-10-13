<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { formatDate } from '$lib/utils/helpers';
  import Card from '$lib/components/ui/Card.svelte';
  import { MapPin, Calendar, CheckCircle, Clock, Rocket } from 'lucide-svelte';

  interface Project {
    id: string;
    title: string;
    description: string | null;
    area: string | null;
    status: 'upcoming' | 'ongoing' | 'completed';
    image_url: string | null;
    model_3d_url: string | null;
    location: string | null;
    completion_date: string | null;
    created_at: string;
  }

  let projects = $state<Project[]>([]);
  let loading = $state(true);
  let filter = $state<'all' | 'completed' | 'ongoing' | 'upcoming'>('all');

  onMount(async () => {
    await loadProjects();
  });

  async function loadProjects() {
    loading = true;
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      if (data) projects = data;
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    loadProjects();
  });

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    ongoing: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    upcoming: { icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-100' }
  };
</script>

<svelte:head>
  <title>Projects - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Our Projects</h1>
      <p class="text-lg text-gray-600">Innovative farming solutions we've implemented</p>
    </div>

    <!-- Filter Tabs -->
    <div class="flex justify-center mb-8">
      <div class="inline-flex rounded-lg border border-gray-300 bg-white p-1">
        <button
          onclick={() => filter = 'all'}
          class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Projects
        </button>
        <button
          onclick={() => filter = 'completed'}
          class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Completed
        </button>
        <button
          onclick={() => filter = 'ongoing'}
          class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'ongoing'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Ongoing
        </button>
        <button
          onclick={() => filter = 'upcoming'}
          class={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'upcoming'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Upcoming
        </button>
      </div>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array(6) as _}
          <Card>
            <div class="animate-pulse">
              <div class="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div class="h-6 bg-gray-200 rounded mb-2"></div>
              <div class="h-4 bg-gray-200 rounded mb-4"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          </Card>
        {/each}
      </div>
    {:else if projects.length === 0}
      <Card>
        <div class="text-center py-12">
          <Rocket size={64} class="mx-auto text-gray-400 mb-4" />
          <p class="text-gray-600">No {filter !== 'all' ? filter : ''} projects found</p>
        </div>
      </Card>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each projects as project}
          {@const config = statusConfig[project.status]}
          {@const Icon = config.icon}
          <Card hover>
            <!-- Project Image -->
            <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
              {#if project.image_url}
                <img
                  src={project.image_url}
                  alt={project.title}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="w-full h-full flex items-center justify-center text-gray-400">
                  <Rocket size={48} />
                </div>
              {/if}
            </div>

            <!-- Project Details -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xl font-semibold text-gray-900">{project.title}</h3>
                <span class={`p-2 rounded-full ${config.bg}`}>
                  <Icon size={20} class={config.color} />
                </span>
              </div>

              {#if project.description}
                <p class="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
              {/if}

              <div class="space-y-2 text-sm">
                {#if project.location}
                  <div class="flex items-center text-gray-600">
                    <MapPin size={16} class="mr-2" />
                    <span>{project.location}</span>
                  </div>
                {/if}

                {#if project.area}
                  <div class="flex items-center text-gray-600">
                    <span class="mr-2">📏</span>
                    <span>Area: {project.area}</span>
                  </div>
                {/if}

                {#if project.completion_date}
                  <div class="flex items-center text-gray-600">
                    <Calendar size={16} class="mr-2" />
                    <span>
                      {project.status === 'completed' ? 'Completed' : 'Expected'}: 
                      {formatDate(project.completion_date)}
                    </span>
                  </div>
                {/if}
              </div>

              {#if project.model_3d_url}
                <a
                  href={project.model_3d_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  View 3D Model
                </a>
              {/if}
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</div>
