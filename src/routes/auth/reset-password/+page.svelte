<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Leaf, Lock, Eye, EyeOff, CheckCircle } from 'lucide-svelte';

  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let validToken = $state(false);
  let email = $state('');
  let token = $state('');

  // Password strength checker
  let passwordStrength = $derived.by(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'text-red-600' };
    if (score <= 3) return { score, label: 'Fair', color: 'text-orange-600' };
    if (score <= 4) return { score, label: 'Good', color: 'text-yellow-600' };
    return { score, label: 'Strong', color: 'text-green-600' };
  });

  onMount(() => {
    // Check URL query parameters for token and email
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlEmail = urlParams.get('email');
    
    if (urlToken && urlEmail) {
      token = urlToken;
      email = urlEmail;
      validToken = true;
      console.log('Valid reset link detected');
    } else {
      console.error('Missing token or email in URL');
      toast.error('Invalid or expired reset link');
      setTimeout(() => goto('/auth/forgot-password'), 2000);
    }
  });

  async function handleResetPassword() {
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/\d/.test(password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    loading = true;
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          token, 
          newPassword: password 
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }
      
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => goto('/auth/login'), 1500);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleResetPassword();
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
  <title>Reset Password - WOW! Organics</title>
  <meta name="description" content="Create a new password for your WOW! Organics account" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-900 mb-2 font-serif" style="font-family: 'Playfair Display', serif;">Reset Password</h2>
      <p class="text-gray-600 font-sans" style="font-family: 'Roboto', sans-serif;">Create a new secure password for your account</p>
    </div>

    {#if validToken}
      <!-- Reset Form -->
      <Card class="shadow-xl">
        <div class="space-y-6">
          
          <!-- New Password -->
          <div class="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="New Password"
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
                <EyeOff size={22} class="mt-2" />
              {:else}
                <Eye size={22} class="mt-2" />
              {/if}
            </button>
            
            {#if password}
              <div class="mt-2">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs text-gray-600">Password strength:</span>
                  <span class="text-xs font-medium {passwordStrength.color}">{passwordStrength.label}</span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full transition-all duration-300 {
                      passwordStrength.score <= 2 ? 'bg-red-500' :
                      passwordStrength.score <= 3 ? 'bg-orange-500' :
                      passwordStrength.score <= 4 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }"
                    style="width: {(passwordStrength.score / 5) * 100}%"
                  ></div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Confirm Password -->
          <div class="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm New Password"
              bind:value={confirmPassword}
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
              onclick={() => showConfirmPassword = !showConfirmPassword}
              class="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {#if showConfirmPassword}
                <EyeOff size={22} class="mt-2" />
              {:else}
                <Eye size={22} class="mt-2" />
              {/if}
            </button>
            
            {#if confirmPassword && password === confirmPassword}
              <div class="flex items-center mt-2 text-green-600 text-xs">
                <CheckCircle size={16} class="mr-1" />
                <span>Passwords match</span>
              </div>
            {:else if confirmPassword && password !== confirmPassword}
              <div class="flex items-center mt-2 text-red-600 text-xs">
                <span>⚠️ Passwords don't match</span>
              </div>
            {/if}
          </div>

          <!-- Password Requirements -->
          <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p class="text-sm font-medium text-blue-900 mb-2">Password must contain:</p>
            <ul class="text-xs text-blue-800 space-y-1">
              <li class="flex items-center">
                <span class="mr-2 {password.length >= 6 ? 'text-green-600' : ''}">{password.length >= 8 ? '✓' : '○'}</span>
                At least 8 characters (required)
              </li>
              <li class="flex items-center">
                <span class="mr-2 {(/[A-Z]/).test(password) ? 'text-green-600' : ''}">{(/[A-Z]/).test(password) ? '✓' : '○'}</span>
                One uppercase letter (recommended)
              </li>
              <li class="flex items-center">
                <span class="mr-2 {(/[a-z]/).test(password) ? 'text-green-600' : ''}">{(/[a-z]/).test(password) ? '✓' : '○'}</span>
                One lowercase letter (recommended)
              </li>
              <li class="flex items-center">
                <span class="mr-2 {(/\d/).test(password) ? 'text-green-600' : ''}">{(/\d/).test(password) ? '✓' : '○'}</span>
                One number (recommended)
              </li>
              <li class="flex items-center">
                <span class="mr-2 {(/[!@#$%^&*(),.?":{}|<>]/).test(password) ? 'text-green-600' : ''}">{(/[!@#$%^&*(),.?":{}|<>]/).test(password) ? '✓' : '○'}</span>
                One special character (required)
              </li>
            </ul>
          </div>

          <!-- Submit Button -->
          <Button
            fullWidth
            size="lg"
            onclick={handleResetPassword}
            loading={loading}
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>

          <!-- Back to Login -->
          <div class="text-center">
            <a 
              href="/auth/login" 
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to login
            </a>
          </div>
        </div>
      </Card>
    {:else}
      <!-- Invalid Token State -->
      <Card class="shadow-xl">
        <div class="text-center space-y-4 py-8">
          <div class="flex justify-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Invalid Reset Link</h3>
            <p class="text-gray-600 mb-4">
              This password reset link is invalid or has expired.
            </p>
          </div>

          <Button
            fullWidth
            onclick={() => goto('/auth/forgot-password')}
            class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            Request New Reset Link
          </Button>
        </div>
      </Card>
    {/if}

    <!-- Security Notice -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500">
        🔒 Choose a strong, unique password that you don't use <br />
        for other accounts to keep your account secure.
      </p>
    </div>
  </div>
</div>
