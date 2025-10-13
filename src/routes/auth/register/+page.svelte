<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { validateEmail, validatePhone } from '$lib/utils/helpers';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let fullName = $state('');
  let email = $state('');
  let phone = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let loading = $state(false);

  async function handleRegister() {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!validatePhone(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    loading = true;
    try {
      await auth.signUp(email, password, fullName, phone);
      toast.success('Account created successfully!');
      goto('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Register - WOW! Organics</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <div class="text-center mb-8">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-2xl">W!</span>
        </div>
      </div>
      <h2 class="text-3xl font-bold text-gray-900">Create Account</h2>
      <p class="mt-2 text-gray-600">Join WOW! Organics today</p>
    </div>

    <Card>
      <form onsubmit={(e) => { e.preventDefault(); handleRegister(); }} class="space-y-6">
        <Input
          type="text"
          label="Full Name"
          bind:value={fullName}
          placeholder="John Doe"
          required
        />

        <Input
          type="email"
          label="Email Address"
          bind:value={email}
          placeholder="you@example.com"
          required
        />

        <Input
          type="tel"
          label="Phone Number"
          bind:value={phone}
          placeholder="9876543210"
          required
        />

        <Input
          type="password"
          label="Password"
          bind:value={password}
          placeholder="••••••••"
          required
        />

        <Input
          type="password"
          label="Confirm Password"
          bind:value={confirmPassword}
          placeholder="••••••••"
          required
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
        >
          Create Account
        </Button>

        <div class="text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <a href="/auth/login" class="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </Card>
  </div>
</div>
