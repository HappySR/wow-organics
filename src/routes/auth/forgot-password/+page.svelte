<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from '$lib/stores/toast.svelte';
  import { validateEmail } from '$lib/utils/helpers';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Lock, Mail, ArrowLeft } from 'lucide-svelte';

  let email = $state('');
  let loading = $state(false);
  let otpSent = $state(false);
  let otpCode = $state('');
  let verifyingOtp = $state(false);

  async function sendEmailOtp() {
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
      const response = await fetch('/api/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      otpSent = true;
      toast.success('OTP sent to your email! Check your inbox.');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      loading = false;
    }
  }

  async function verifyOtpAndReset() {
    if (!otpCode) {
      toast.error('Please enter the OTP');
      return;
    }

    const cleanOtp = otpCode.trim().replace(/\s/g, '');
    
    if (cleanOtp.length !== 6) {
      toast.error('OTP must be exactly 6 digits');
      return;
    }

    if (!/^\d+$/.test(cleanOtp)) {
      toast.error('OTP must contain only numbers');
      return;
    }

    verifyingOtp = true;
    try {
      const response = await fetch('/api/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          otp: cleanOtp 
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Invalid OTP');
      }

      // OTP verified, redirect to reset password page
      toast.success('OTP verified! Redirecting...');
      setTimeout(() => {
        goto(`/auth/reset-password?token=${result.token}&email=${encodeURIComponent(email)}`);
      }, 500);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      verifyingOtp = false;
    }
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && !otpSent) {
      sendEmailOtp();
    } else if (e.key === 'Enter' && otpSent) {
      verifyOtpAndReset();
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
        No worries, we'll send you an OTP to reset your password
      </p>
    </div>

    <!-- Form -->
    <Card class="shadow-xl">
      <div class="space-y-6">
        {#if !otpSent}
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
              Enter your email address and we'll send you a 6-digit OTP to reset your password.
            </p>
          </div>

          <!-- Submit Button -->
          <Button
            fullWidth
            size="lg"
            onclick={sendEmailOtp}
            loading={loading}
            disabled={loading}
            class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
          >
            Send OTP
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
        {:else}
          <!-- OTP Verification -->
          <div class="space-y-6">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-sm text-green-800 mb-2">
                📧 We've sent a 6-digit OTP to:
              </p>
              <p class="font-semibold text-green-900">{email}</p>
              <p class="text-xs text-green-700 mt-2">
                Please check your inbox (and spam folder)
              </p>
            </div>

            <!-- OTP Input -->
            <div class="relative">
              <Input
                type="text"
                label="Enter OTP"
                bind:value={otpCode}
                placeholder="000000"
                required
                maxlength={6}
                class="pl-10 text-center text-2xl tracking-widest font-mono"
                onkeypress={handleKeyPress}
                oninput={(e) => otpCode = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)}
              />
              <Lock size={20} class="absolute left-3 top-11 text-gray-400" />
            </div>

            <!-- Verify Button -->
            <Button
              fullWidth
              size="lg"
              onclick={verifyOtpAndReset}
              loading={verifyingOtp}
              disabled={verifyingOtp || otpCode.length !== 6}
              class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
            >
              {verifyingOtp ? 'Verifying...' : 'Verify OTP & Continue'}
            </Button>

            <!-- Resend Options -->
            <div class="flex items-center justify-center gap-3 text-sm">
              <button
                onclick={() => { otpSent = false; otpCode = ''; email = ''; }}
                class="text-green-600 hover:text-green-700 font-medium transition-colors"
                type="button"
              >
                Change email
              </button>
              <span class="text-gray-400">•</span>
              <button
                onclick={sendEmailOtp}
                disabled={loading}
                class="text-green-600 hover:text-green-700 font-medium transition-colors disabled:opacity-50"
                type="button"
              >
                Resend OTP
              </button>
            </div>

            <!-- Back to Login -->
            <div class="text-center pt-4 border-t">
              <a 
                href="/auth/login" 
                class="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                <ArrowLeft size={16} class="mr-2" />
                Back to login
              </a>
            </div>
          </div>
        {/if}
      </div>
    </Card>

    <!-- Help Text -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500">
        Need help? Contact our support team at <br />
        <a href="mailto:support@woworganics.com" class="text-green-600 hover:text-green-700 font-medium">
          support@woworganics.com
        </a>
      </p>
    </div>
  </div>
</div>
