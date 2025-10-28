import { goto } from '$app/navigation';
import { supabase } from '$lib/utils/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'trainee' | 'instructor' | 'admin';
  created_at?: string;
  updated_at?: string;
}

class AuthStore {
  user = $state<User | null>(null);
  profile = $state<Profile | null>(null);
  loading = $state(true);
  error = $state<string | null>(null);
  initialized = $state(false);

  private loadingProfile = false;

  constructor() {
    this.initialize();
  }

  get isAuthenticated() {
    return this.user !== null;
  }

  get isCustomer() {
    return this.profile?.role === 'customer';
  }

  get isTrainee() {
    return this.profile?.role === 'trainee';
  }

  get isInstructor() {
    return this.profile?.role === 'instructor';
  }

  get isAdmin() {
    return this.profile?.role === 'admin';
  }

  get userRole() {
    return this.profile?.role || 'customer';
  }

  get userName() {
    return this.profile?.full_name || this.user?.email?.split('@')[0] || 'User';
  }

  get userEmail() {
    return this.user?.email || '';
  }

  async initialize() {
    console.log('🔄 Initializing auth...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Session found:', session.user.email);
        this.user = session.user;
        await this.loadProfile(session.user.id);
      } else {
        console.log('ℹ️ No active session');
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.user = session.user;
          await this.loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.user = null;
          this.profile = null;
        } else if (event === 'USER_UPDATED' && session?.user) {
          this.user = session.user;
        } else if (event === 'INITIAL_SESSION' && session?.user) {
          if (!this.user) {
            this.user = session.user;
            await this.loadProfile(session.user.id);
          }
        }
      });
    } catch (err) {
      console.error('❌ Auth initialization error:', err);
      this.error = err instanceof Error ? err.message : 'Initialization failed';
    } finally {
      this.loading = false;
      this.initialized = true;
      console.log('✅ Auth initialized');
    }
  }

  async loadProfile(userId: string) {
    if (this.loadingProfile) {
      console.log('⏳ Profile already loading, skipping...');
      return;
    }

    this.loadingProfile = true;

    console.log('📥 Loading profile...');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors

      if (error) {
        console.error('⚠️ Profile load error:', error.message, error.code);
        this.error = error.message;
        return;
      }

      if (data) {
        this.profile = data;
        console.log('✅ Profile loaded:', data.email, `(${data.role})`);
      } else {
        console.log('ℹ️ Profile not found yet');
      }
    } catch (err) {
      console.error('❌ Profile load exception:', err);
      this.error = err instanceof Error ? err.message : 'Profile load failed';
    } finally {
      this.loadingProfile = false;
    }
  }

  async createProfileViaAPI(userId: string, email: string, fullName: string, phone: string): Promise<boolean> {
    console.log('🔨 Creating profile via API...');
    
    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          fullName,
          phone
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ API profile creation failed:', result.error);
        return false;
      }

      console.log('✅ Profile created via API');
      this.profile = result.profile;
      return true;
    } catch (err) {
      console.error('❌ API call failed:', err);
      return false;
    }
  }

  async signUp(email: string, password: string, fullName: string, phone: string) {
    this.loading = true;
    this.error = null;

    console.log('📝 Signing up:', email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim()
          }
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ User created:', data.user.email);
        this.user = data.user;
        
        // Try to create profile via API (more reliable than trigger)
        const created = await this.createProfileViaAPI(
          data.user.id,
          email.trim().toLowerCase(),
          fullName.trim(),
          phone.trim()
        );

        if (!created) {
          // If API fails, wait for trigger and try loading
          console.log('⏳ Waiting for trigger to create profile...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.loadProfile(data.user.id);
        }
      }

      return data;
    } catch (err) {
      console.error('❌ Signup failed:', err);
      this.error = err instanceof Error ? err.message : 'Sign up failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async signIn(email: string, password: string) {
    this.loading = true;
    this.error = null;

    console.log('🔐 Signing in:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('❌ Signin error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Signed in:', data.user.email);
        this.user = data.user;
        await this.loadProfile(data.user.id);
      }

      return data;
    } catch (err) {
      console.error('❌ Signin failed:', err);
      this.error = err instanceof Error ? err.message : 'Sign in failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async signOut() {
    this.loading = true;
    this.error = null;

    console.log('👋 Signing out...');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.user = null;
      this.profile = null;

      console.log('✅ Signed out');
      goto('/auth/login');
    } catch (err) {
      console.error('❌ Signout error:', err);
      this.error = err instanceof Error ? err.message : 'Sign out failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async updateProfile(updates: Partial<Profile>) {
    if (!this.user) {
      this.error = 'No user logged in';
      throw new Error('No user logged in');
    }

    this.loading = true;
    this.error = null;

    console.log('📝 Updating profile...');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.user.id)
        .select()
        .single();

      if (error) throw error;

      this.profile = data;
      console.log('✅ Profile updated');
      return data;
    } catch (err) {
      console.error('❌ Profile update error:', err);
      this.error = err instanceof Error ? err.message : 'Update failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async updatePassword(newPassword: string) {
    this.loading = true;
    this.error = null;

    console.log('🔒 Updating password...');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      console.log('✅ Password updated');
    } catch (err) {
      console.error('❌ Password update error:', err);
      this.error = err instanceof Error ? err.message : 'Password update failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async resetPassword(email: string) {
    this.loading = true;
    this.error = null;

    console.log('🔄 Sending password reset email...');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      
      console.log('✅ Password reset email sent');
    } catch (err) {
      console.error('❌ Password reset error:', err);
      this.error = err instanceof Error ? err.message : 'Password reset failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }
}

export const auth = new AuthStore();
