import { goto } from '$app/navigation';
import { auth } from '$lib/stores/auth.svelte';
import { browser } from '$app/environment';

export async function requireAdmin(redirectPath?: string): Promise<boolean> {
  if (!browser) return false;
  
  // Wait for auth to be ready (max 10 seconds)
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds total
  
  while (auth.loading && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // If still loading after timeout, assume not authenticated
  if (auth.loading) {
    console.warn('Auth loading timeout, redirecting to login');
    const targetPath = redirectPath || window.location.pathname;
    await goto(`/login?redirect=${encodeURIComponent(targetPath)}`);
    return false;
  }
  
  // Check if user is authenticated
  if (!auth.isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    const targetPath = redirectPath || window.location.pathname;
    await goto(`/login?redirect=${encodeURIComponent(targetPath)}`);
    return false;
  }
  
  // Wait for profile to load if user exists but profile is null
  if (!auth.profile && auth.user) {
    console.log('Waiting for profile to load...');
    let profileAttempts = 0;
    while (!auth.profile && profileAttempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      profileAttempts++;
    }
  }
  
  // Check if user is admin
  const isAdmin = auth.profile?.role === 'admin';
  
  if (!isAdmin) {
    console.log('Not admin, current role:', auth.profile?.role);
    // Redirect to home or show unauthorized page
    await goto('/');
    return false;
  }
  
  console.log('Admin check passed');
  return true;
}

export async function requireAuth(redirectPath?: string): Promise<boolean> {
  if (!browser) return false;
  
  // Wait for auth to initialize (max 10 seconds)
  let attempts = 0;
  const maxAttempts = 100;
  
  while (auth.loading && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!auth.isAuthenticated) {
    const targetPath = redirectPath || window.location.pathname;
    await goto(`/auth/login?redirect=${encodeURIComponent(targetPath)}`);
    return false;
  }
  
  return true;
}
