<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Leaf, Mail, Lock, Eye, EyeOff } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let showPassword = $state(false);
  let rememberMe = $state(false);

  // Load saved credentials on mount
  onMount(() => {
    const savedEmail = localStorage.getItem('wow_remembered_email');
    const savedRemember = localStorage.getItem('wow_remember_me');
    
    if (savedEmail && savedRemember === 'true') {
      email = savedEmail;
      rememberMe = true;
    }
  });

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    loading = true;
    try {
      await auth.signIn(email, password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('wow_remembered_email', email);
        localStorage.setItem('wow_remember_me', 'true');
      } else {
        localStorage.removeItem('wow_remembered_email');
        localStorage.removeItem('wow_remember_me');
      }
      
      toast.success('Welcome back!');
      
      // Redirect based on role
      if (auth.isAdmin) {
        goto('/admin');
      } else {
        goto('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
  <title>Login - WOW! Organics</title>
  <meta name="description" content="Sign in to your WOW! Organics account" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center pt-0 pb-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-900 mb-2 font-serif" style="font-family: 'Playfair Display', serif;">
        Welcome Back
      </h2>
      <p class="text-gray-600 font-sans" style="font-family: 'Roboto', sans-serif;">
        Sign in to your WOW! Organics account
      </p>
    </div>

    <!-- Login Form -->
    <Card class="shadow-xl">
      <div class="space-y-6">
        
        <!-- Email Input -->
        <div class="relative w-full">
          <Input
            type="email"
            label="Email Address"
            bind:value={email}
            placeholder="your@email.com"
            required
            onkeypress={handleKeyPress}
            class="pl-10"
          />
          <div class="absolute pt-7 inset-y-0 left-3 flex items-center pointer-events-none">
            <Mail size={22} class="text-gray-400" />
          </div>
        </div>

        <!-- Password Input -->
        <div class="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            bind:value={password}
            placeholder="••••••••"
            required
            onkeypress={handleKeyPress}
            class="pl-10 pr-10"
          />
          <div class="absolute pt-7 inset-y-0 left-3 flex items-center pointer-events-none">
            <Lock size={22} class="text-gray-400" />
          </div>
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            class="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {#if showPassword}
              <div class="pt-2 flex items-center pointer-events-none">
                <EyeOff size={22} class="text-gray-400" />
              </div>
            {:else}
              <div class="pt-2 flex items-center pointer-events-none">
                <Eye size={22} class="text-gray-400" />
              </div>
            {/if}
          </button>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              bind:checked={rememberMe}
              class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer transition-colors"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <a 
              href="/auth/forgot-password" 
              class="font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <!-- Sign In Button -->
        <Button
          fullWidth
          size="lg"
          onclick={handleLogin}
          loading={loading}
          class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
        >
          Sign In
        </Button>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-white text-gray-500">New to WOW! Organics?</span>
          </div>
        </div>

        <!-- Register Link -->
        <div class="text-center">
          <a 
            href="/auth/register" 
            class="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Create an account
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <!-- Admin Notice -->
        <div class="relative mt-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-white text-gray-400 text-xs">Admin Access</span>
          </div>
        </div>

        <div class="bg-green-50 border border-green-100 rounded-lg p-3">
          <p class="text-xs text-center text-gray-600">
            Admin users will be automatically redirected to the admin dashboard upon login
          </p>
        </div>
      </div>
    </Card>
  </div>
</div>
