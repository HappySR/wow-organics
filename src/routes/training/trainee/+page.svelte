<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { formatDate } from '$lib/utils/helpers';
  import Card from '$lib/components/ui/Card.svelte';
  import { BookOpen, Clock, Award, TrendingUp } from 'lucide-svelte';

  if (!auth.isAuthenticated) {
    goto('/auth/login');
  }

  let enrollments = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await loadEnrollments();
  });

  async function loadEnrollments() {
    loading = true;
    try {
      const { data } = await supabase
        .from('training_enrollments')
        .select(`
          *,
          course:training_courses(*)
        `)
        .eq('trainee_id', auth.user!.id)
        .order('enrollment_date', { ascending: false });

      if (data) enrollments = data;
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      loading = false;
    }
  }

  const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };
</script>

<svelte:head>
  <title>My Courses - WOW! Organics Training</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
      <p class="text-gray-600">Track your learning progress</p>
    </div>

    {#if loading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array(3) as _}
          <Card>
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 rounded mb-4"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          </Card>
        {/each}
      </div>
    {:else if enrollments.length === 0}
      <Card>
        <div class="text-center py-12">
          <BookOpen size={64} class="mx-auto text-gray-400 mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">No enrollments yet</h2>
          <p class="text-gray-600 mb-6">Start your learning journey today!</p>
          <button
            onclick={() => goto('/training')}
            class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Courses
          </button>
        </div>
      </Card>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each enrollments as enrollment}
          {@const course = enrollment.course}
          <Card hover>
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                <span class={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[enrollment.status]}`}>
                  {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                </span>
              </div>
              <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen size={24} class="text-primary-600" />
              </div>
            </div>

            {#if course.description}
              <p class="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
            {/if}

            <!-- Progress Bar -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Progress</span>
                <span class="text-sm font-medium text-primary-600">{enrollment.progress}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-primary-600 h-2 rounded-full transition-all"
                  style={`width: ${enrollment.progress}%`}
                ></div>
              </div>
            </div>

            <div class="space-y-2 text-sm text-gray-600">
              {#if course.duration_hours}
                <div class="flex items-center">
                  <Clock size={16} class="mr-2" />
                  <span>{course.duration_hours} hours</span>
                </div>
              {/if}

              <div class="flex items-center">
                <TrendingUp size={16} class="mr-2" />
                <span>Enrolled: {formatDate(enrollment.enrollment_date)}</span>
              </div>

              {#if enrollment.certificate_url}
                <div class="flex items-center text-green-600">
                  <Award size={16} class="mr-2" />
                  <a href={enrollment.certificate_url} target="_blank" class="hover:underline">
                    Download Certificate
                  </a>
                </div>
              {/if}
            </div>

            {#if enrollment.status === 'active'}
              <button
                class="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Continue Learning
              </button>
            {/if}
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</div>
