<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { validateEmail } from '$lib/utils/helpers';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Leaf, Mail, ArrowLeft, CheckCircle } from 'lucide-svelte';

  let email = $state('');
  let loading = $state(false);
  let emailSent = $state(false);

  async function handleForgotPassword() {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    loading = true;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      emailSent = true;
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !emailSent) {
      handleForgotPassword();
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
  <title>Forgot Password - WOW! Organics</title>
  <meta name="description" content="Reset your WOW! Organics account password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-900 mb-2 font-serif" style="font-family: 'Playfair Display', serif;">Forgot Password?</h2>
      <p class="text-gray-600 font-sans" style="font-family: 'Roboto', sans-serif;">
        {#if emailSent}
          Check your email for reset instructions
        {:else}
          No worries, we'll send you reset instructions
        {/if}
      </p>
    </div>

    <!-- Form -->
    <Card class="shadow-xl">
      {#if !emailSent}
        <div class="space-y-6">
          <!-- Email Input -->
          <div class="relative">
            <Input
              type="email"
              label="Email Address"
              bind:value={email}
              placeholder="your@email.com"
              required
              onkeypress={handleKeyPress}
              class="pl-10"
            />
            <Mail size={20} class="absolute left-3 top-11 text-gray-400" />
          </div>

          <!-- Instructions -->
          <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p class="text-sm text-blue-800">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <!-- Submit Button -->
          <Button
            fullWidth
            size="lg"
            onclick={handleForgotPassword}
            loading={loading}
            class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
          >
            Send Reset Link
          </Button>

          <!-- Back to Login -->
          <div class="text-center">
            <a 
              href="/auth/login" 
              class="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors text-sm"
            >
              <ArrowLeft size={16} class="mr-2" />
              Back to login
            </a>
          </div>
        </div>
      {:else}
        <!-- Success State -->
        <div class="space-y-6 text-center">
          <div class="flex justify-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} class="text-green-600" />
            </div>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Email Sent!</h3>
            <p class="text-gray-600 mb-4">
              We've sent a password reset link to:
            </p>
            <p class="font-medium text-green-600 mb-4">{email}</p>
            <p class="text-sm text-gray-500">
              Please check your inbox and click the link to reset your password.
              The link will expire in 1 hour.
            </p>
          </div>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-white text-gray-500">Didn't receive the email?</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-3">
            <Button
              fullWidth
              variant="outline"
              onclick={() => { emailSent = false; email = ''; }}
            >
              Try another email
            </Button>

            <div class="text-sm text-gray-500">
              <p class="mb-2">Check your spam folder or</p>
              <button
                onclick={handleForgotPassword}
                class="text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Resend email
              </button>
            </div>
          </div>

          <!-- Back to Login -->
          <div class="pt-4">
            <a 
              href="/auth/login" 
              class="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors text-sm"
            >
              <ArrowLeft size={16} class="mr-2" />
              Back to login
            </a>
          </div>
        </div>
      {/if}
    </Card>

    <!-- Help Text -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500">
        Need help? Contact our support team at <br />
        <a href="mailto:support@woworganics.com" class="text-green-600 hover:text-green-700">
          support@woworganics.com
        </a>
      </p>
    </div>
  </div>
</div>
