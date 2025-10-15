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
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        this.user = session.user;
        await this.loadProfile(session.user.id);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          this.user = session.user;
          await this.loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.user = null;
          this.profile = null;
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery initiated');
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            this.user = session.user;
            await this.loadProfile(session.user.id);
          }
        }
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
      this.error = err instanceof Error ? err.message : 'Initialization failed';
    } finally {
      this.loading = false;
      this.initialized = true;
    }
  }

  async loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile doesn't exist (PGRST116 error), create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating...');
          await this.createProfile(userId);
          return;
        }
        throw error;
      }

      this.profile = data;
    } catch (err) {
      console.error('Profile load error:', err);
      this.error = err instanceof Error ? err.message : 'Profile load failed';
    }
  }

  async createProfile(userId: string) {
    try {
      console.log('Creating profile for user:', userId);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const user = userData.user;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          role: 'customer'
        })
        .select()
        .single();

      if (error) {
        // Ignore duplicate key errors
        if (error.code === '23505') {
          console.log('Profile already exists, loading...');
          await this.loadProfile(userId);
          return;
        }
        throw error;
      }
      
      console.log('Profile created successfully:', data);
      this.profile = data;
    } catch (err) {
      console.error('Profile creation error:', err);
      this.error = err instanceof Error ? err.message : 'Profile creation failed';
      throw err;
    }
  }

  async signUp(email: string, password: string, fullName: string, phone: string) {
    this.loading = true;
    this.error = null;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });

      if (error) throw error;

      if (data.user) {
        // Wait a bit for trigger to execute or create profile manually
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.loadProfile(data.user.id);
      }

      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Sign up failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async signIn(email: string, password: string) {
    this.loading = true;
    this.error = null;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        this.user = data.user;
        await this.loadProfile(data.user.id);
      }

      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Sign in failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async signOut() {
    this.loading = true;
    this.error = null;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.user = null;
      this.profile = null;

      goto('/auth/login');
    } catch (err) {
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

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.user.id)
        .select()
        .single();

      if (error) throw error;

      this.profile = data;
      return data;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Update failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async updatePassword(newPassword: string) {
    this.loading = true;
    this.error = null;

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Password update failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async resetPassword(email: string) {
    this.loading = true;
    this.error = null;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Password reset failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }
}

export const auth = new AuthStore();
