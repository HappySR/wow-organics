<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { formatDate, formatCurrency } from '$lib/utils/helpers';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { BookOpen, Users, BarChart, Calendar } from 'lucide-svelte';

  if (!auth.isAuthenticated || !auth.isInstructor) {
    goto('/training');
  }

  let courses = $state<any[]>([]);
  let stats = $state({ total_courses: 0, total_students: 0, active_courses: 0 });
  let loading = $state(true);

  onMount(async () => {
    await loadInstructorData();
  });

  async function loadInstructorData() {
    loading = true;
    try {
      // Load courses taught by this instructor
      const { data: coursesData } = await supabase
        .from('training_courses')
        .select(`
          *,
          enrollments:training_enrollments(count)
        `)
        .eq('instructor_id', auth.user!.id)
        .order('created_at', { ascending: false });

      if (coursesData) {
        courses = coursesData;
        
        // Calculate stats
        stats.total_courses = coursesData.length;
        stats.active_courses = coursesData.filter(c => c.status === 'ongoing' || c.status === 'upcoming').length;
        stats.total_students = coursesData.reduce((sum, c) => sum + (c.enrollments?.[0]?.count || 0), 0);
      }
    } catch (error) {
      console.error('Error loading instructor data:', error);
    } finally {
      loading = false;
    }
  }

  const statusColors = {
    upcoming: 'bg-purple-100 text-purple-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };
</script>

<svelte:head>
  <title>Instructor Dashboard - WOW! Organics Training</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Instructor Dashboard</h1>
      <p class="text-gray-600">Manage your courses and students</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Total Courses</p>
            <p class="text-3xl font-bold text-gray-900">{stats.total_courses}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <BookOpen size={24} class="text-primary-600" />
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Active Courses</p>
            <p class="text-3xl font-bold text-gray-900">{stats.active_courses}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart size={24} class="text-blue-600" />
          </div>
        </div>
      </Card>

      <Card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Total Students</p>
            <p class="text-3xl font-bold text-gray-900">{stats.total_students}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Users size={24} class="text-green-600" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Courses List -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Your Courses</h2>
        <Button>Create New Course</Button>
      </div>

      {#if loading}
        <div class="space-y-4">
          {#each Array(3) as _}
            <Card>
              <div class="animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div class="h-20 bg-gray-200 rounded"></div>
              </div>
            </Card>
          {/each}
        </div>
      {:else if courses.length === 0}
        <Card>
          <div class="text-center py-12">
            <BookOpen size={64} class="mx-auto text-gray-400 mb-4" />
            <h3 class="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p class="text-gray-600 mb-6">Create your first course to get started</p>
            <Button>Create Course</Button>
          </div>
        </Card>
      {:else}
        <div class="space-y-4">
          {#each courses as course}
            <Card hover>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <h3 class="text-xl font-semibold text-gray-900">{course.title}</h3>
                    <span class={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[course.status as keyof typeof statusColors]}`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </div>

                  {#if course.description}
                    <p class="text-gray-600 mb-4">{course.description}</p>
                  {/if}

                  <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                    {#if course.start_date}
                      <div class="flex items-center">
                        <Calendar size={16} class="mr-1" />
                        <span>Starts: {formatDate(course.start_date)}</span>
                      </div>
                    {/if}

                    {#if course.duration_hours}
                      <div class="flex items-center">
                        <BookOpen size={16} class="mr-1" />
                        <span>{course.duration_hours} hours</span>
                      </div>
                    {/if}

                    <div class="flex items-center">
                      <Users size={16} class="mr-1" />
                      <span>{course.enrollments?.[0]?.count || 0} / {course.max_participants || '∞'} students</span>
                    </div>

                    {#if course.price}
                      <div class="flex items-center font-semibold text-primary-600">
                        <span>{formatCurrency(course.price)}</span>
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="flex space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">View Students</Button>
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
