<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Leaf } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    loading = true;
    try {
      await auth.signIn(email, password);
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
  <title>Login - WOW! Organics</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
          <Leaf size={32} class="text-white" />
        </div>
      </div>
      <h2 class="text-3xl font-bold text-gray-900">Welcome Back</h2>
      <p class="mt-2 text-gray-600">Sign in to your WOW! Organics account</p>
    </div>

    <Card>
      <div class="space-y-6">
        <Input
          type="email"
          label="Email Address"
          bind:value={email}
          placeholder="your@email.com"
          required
          onkeypress={handleKeyPress}
        />

        <Input
          type="password"
          label="Password"
          bind:value={password}
          placeholder="••••••••"
          required
          onkeypress={handleKeyPress}
        />

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <a href="/auth/forgot-password" class="font-medium text-primary-600 hover:text-primary-500">
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onclick={handleLogin}
          loading={loading}
        >
          Sign In
        </Button>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <a href="/auth/register" class="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </a>
          </p>
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Admin Access</span>
          </div>
        </div>

        <p class="text-xs text-center text-gray-500">
          Admin users will be automatically redirected to the admin dashboard
        </p>
      </div>
    </Card>
  </div>
</div>
