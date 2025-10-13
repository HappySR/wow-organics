<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatCurrency, formatDate } from '$lib/utils/helpers';
  import type { TrainingCourse } from '$lib/types';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { BookOpen, Clock, Users, Award, Calendar } from 'lucide-svelte';

  let courses = $state<TrainingCourse[]>([]);
  let enrolledCourses = $state<string[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await loadCourses();
    if (auth.isAuthenticated) {
      await loadEnrollments();
    }
  });

  async function loadCourses() {
    loading = true;
    try {
      const { data } = await supabase
        .from('training_courses')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (data) courses = data;
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      loading = false;
    }
  }

  async function loadEnrollments() {
    const { data } = await supabase
      .from('training_enrollments')
      .select('course_id')
      .eq('trainee_id', auth.user!.id);
    
    if (data) {
      enrolledCourses = data.map(e => e.course_id);
    }
  }

  async function enrollCourse(courseId: string) {
    if (!auth.isAuthenticated) {
      toast.info('Please login to enroll');
      goto('/auth/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('training_enrollments')
        .insert({
          course_id: courseId,
          trainee_id: auth.user!.id
        });

      if (error) throw error;

      toast.success('Successfully enrolled in course!');
      await loadEnrollments();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You are already enrolled in this course');
      } else {
        toast.error('Failed to enroll in course');
      }
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
  <title>Training Portal - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Training Portal</h1>
      <p class="text-lg text-gray-600 mb-8">
        Learn sustainable farming techniques from expert instructors
      </p>

      {#if auth.isAuthenticated}
        <div class="flex justify-center gap-4">
          {#if auth.isTrainee || auth.isCustomer}
            <Button onclick={() => goto('/training/trainee')}>
              My Courses
            </Button>
          {/if}
          {#if auth.isInstructor}
            <Button variant="secondary" onclick={() => goto('/training/instructor')}>
              Instructor Dashboard
            </Button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Course Grid -->
    {#if loading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each Array(6) as _}
          <Card>
            <div class="animate-pulse">
              <div class="h-6 bg-gray-200 rounded mb-4"></div>
              <div class="h-4 bg-gray-200 rounded mb-2"></div>
              <div class="h-4 bg-gray-200 rounded mb-4"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          </Card>
        {/each}
      </div>
    {:else if courses.length === 0}
      <Card>
        <div class="text-center py-12">
          <BookOpen size={64} class="mx-auto text-gray-400 mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">No courses available</h2>
          <p class="text-gray-600">Check back soon for new training programs!</p>
        </div>
      </Card>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each courses as course}
          {@const isEnrolled = enrolledCourses.includes(course.id)}
          <Card hover>
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                <span class={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[course.status]}`}>
                  {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                </span>
              </div>
              <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen size={24} class="text-primary-600" />
              </div>
            </div>

            {#if course.description}
              <p class="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
            {/if}

            <div class="space-y-2 mb-4 text-sm text-gray-600">
              {#if course.duration_hours}
                <div class="flex items-center">
                  <Clock size={16} class="mr-2" />
                  <span>{course.duration_hours} hours</span>
                </div>
              {/if}

              {#if course.start_date}
                <div class="flex items-center">
                  <Calendar size={16} class="mr-2" />
                  <span>Starts: {formatDate(course.start_date)}</span>
                </div>
              {/if}

              {#if course.max_participants}
                <div class="flex items-center">
                  <Users size={16} class="mr-2" />
                  <span>Max {course.max_participants} participants</span>
                </div>
              {/if}

              {#if course.price}
                <div class="flex items-center font-semibold text-primary-600">
                  <Award size={16} class="mr-2" />
                  <span>{formatCurrency(course.price)}</span>
                </div>
              {/if}
            </div>

            {#if isEnrolled}
              <Button fullWidth disabled>
                Already Enrolled
              </Button>
            {:else if course.status === 'upcoming' || course.status === 'ongoing'}
              <Button
                fullWidth
                onclick={() => enrollCourse(course.id)}
              >
                Enroll Now
              </Button>
            {:else}
              <Button fullWidth disabled>
                {course.status === 'completed' ? 'Course Completed' : 'Not Available'}
              </Button>
            {/if}
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</div>
