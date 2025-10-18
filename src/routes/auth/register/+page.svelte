<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { validateEmail, validatePhone } from '$lib/utils/helpers';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { Leaf, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle } from 'lucide-svelte';

  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);
  let showPassword = $state(false);
  let showConfirmPassword = $state(false);
  let agreeToTerms = $state(false);
  let otpSent = $state(false);
  let otpCode = $state('');
  let otpSessionId = $state('');
  let verifyingOtp = $state(false);

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

  async function sendOtp() {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhone(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    loading = true;
    try {
      // Check if email already exists
      const checkResponse = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const checkResult = await checkResponse.json();

      if (checkResult.exists) {
        toast.error('An account with this email already exists. Please login instead.');
        return;
      }

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error);

      otpSessionId = result.sessionId;
      otpSent = true;
      toast.success('OTP sent to your mobile number');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      loading = false;
    }
  }

  async function verifyOtpAndRegister() {
    if (!otpCode) {
      toast.error('Please enter the OTP');
      return;
    }

    verifyingOtp = true;
    try {
      // Verify OTP first
      const verifyResponse = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: otpSessionId, otp: otpCode })
      });

      const verifyResult = await verifyResponse.json();
      
      if (!verifyResponse.ok) throw new Error(verifyResult.error);

      // OTP verified, now register
      if (!fullName || !email || !password || !confirmPassword) {
        toast.error('Please fill in all fields');
        return;
      }

      if (!validateEmail(email)) {
        toast.error('Please enter a valid email address');
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

      if (!agreeToTerms) {
        toast.error('Please agree to the terms and conditions');
        return;
      }

      await auth.signUp(email, password, fullName, phone);
      toast.success('Account created successfully!');
      goto('/auth/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      verifyingOtp = false;
    }
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
  <title>Register - WOW! Organics</title>
  <meta name="description" content="Join WOW! Organics and start your journey to organic living" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h2 class="text-4xl font-bold text-gray-900 mb-2 font-serif" style="font-family: 'Playfair Display', serif;">
        Create Account
      </h2>
      <p class="text-gray-600 font-sans" style="font-family: 'Roboto', sans-serif;">
        Join WOW! Organics and discover natural living
      </p>
    </div>
    
    <!-- Registration Form -->
    <Card class="shadow-xl">
      <form onsubmit={(e) => { e.preventDefault(); }} class="space-y-5">
        
        <!-- Full Name -->
        <div class="relative">
          <Input
            type="text"
            label="Full Name"
            bind:value={fullName}
            placeholder="John Doe"
            required
            class="pl-10"
          />
          <div class="absolute pt-7 inset-y-0 left-3 flex items-center pointer-events-none">
            <User size={22} class="text-gray-400" />
          </div>
        </div>

        <!-- Email -->
        <div class="relative">
          <Input
            type="email"
            label="Email Address"
            bind:value={email}
            placeholder="you@example.com"
            required
            class="pl-10"
          />
          <div class="absolute pt-7 inset-y-0 left-3 flex items-center pointer-events-none">
            <Mail size={22} class="text-gray-400" />
          </div>
        </div>

        <!-- Phone -->
        <div class="relative">
          <Input
            type="tel"
            label="Phone Number"
            bind:value={phone}
            placeholder="9876543210"
            required
            class="pl-10"
          />
          <div class="absolute pt-7 inset-y-0 left-3 flex items-center pointer-events-none">
            <Phone size={22} class="text-gray-400" />
          </div>
        </div>

        {#if otpSent}
        <!-- OTP Input -->
        <div class="relative">
          <Input
            type="text"
            label="Enter OTP"
            bind:value={otpCode}
            placeholder="6-digit OTP"
            required
            maxlength={6}
            class="pl-10"
          />
          <div class="absolute mb-6 pt-7 inset-y-0 left-3 flex items-center pointer-events-none">
            <Lock size={22} class="text-gray-400" />
          </div>
          <div class="mt-2 text-sm text-gray-600">
            OTP sent to {phone}. 
            <button type="button" onclick={sendOtp} class="text-green-600 hover:text-green-700 font-medium">
              Resend OTP
            </button>
          </div>
        </div>
      {/if}

        <!-- Password -->
        <div class="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            bind:value={password}
            placeholder="••••••••"
            required
            class="pl-10 pr-10"
          />
          <div
            class="absolute inset-y-0 left-3 flex items-center pointer-events-none"
            class:mt-7={!password}
            class:pb-2={!!password}
          >
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
            label="Confirm Password"
            bind:value={confirmPassword}
            placeholder="••••••••"
            required
            class="pl-10 pr-10"
          />
          <div
            class="absolute pt-7 inset-y-0 left-3 flex items-center pointer-events-none"
            class:mb-6={confirmPassword && password === confirmPassword}
          >
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
          {/if}
        </div>

        <!-- Terms and Conditions -->
        <div class="flex items-start">
          <input
            id="agree-terms"
            type="checkbox"
            bind:checked={agreeToTerms}
            class="h-4 w-4 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
          />
          <label for="agree-terms" class="ml-2 block text-sm text-gray-700 cursor-pointer">
            I agree to the <a href="/terms" class="text-green-600 hover:text-green-700 font-medium">Terms and Conditions</a> and <a href="/privacy" class="text-green-600 hover:text-green-700 font-medium">Privacy Policy</a>
          </label>
        </div>

        {#if !otpSent}
        <!-- Send OTP Button -->
        <Button
          type="button"
          fullWidth
          size="lg"
          onclick={sendOtp}
          loading={loading}
          disabled={!fullName || !email || !phone || !password || !confirmPassword || !agreeToTerms}
          class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
        >
          Send OTP
        </Button>
      {:else}
        <!-- Verify & Register Button -->
        <Button
          type="button"
          fullWidth
          size="lg"
          onclick={verifyOtpAndRegister}
          loading={verifyingOtp}
          class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200"
        >
          Verify OTP & Create Account
        </Button>
      {/if}

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-white text-gray-500">Already have an account?</span>
          </div>
        </div>

        <!-- Login Link -->
        <div class="text-center">
          <a 
            href="/auth/login" 
            class="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Sign in instead
            <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </form>
    </Card>

    <!-- Additional Info -->
    <div class="mt-6 text-center">
      <p class="text-xs text-gray-500">
        By creating an account, you'll get access to exclusive offers, <br />
        faster checkout, and order tracking.
      </p>
    </div>
  </div>
</div>
