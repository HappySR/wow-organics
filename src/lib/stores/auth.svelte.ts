import { supabase } from '$lib/utils/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'trainee' | 'instructor' | 'admin';
}

class AuthStore {
  user = $state<User | null>(null);
  profile = $state<Profile | null>(null);
  loading = $state(true);
  error = $state<string | null>(null);

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

  async initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.user = session.user;
        await this.loadProfile(session.user.id);
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          this.user = session.user;
          await this.loadProfile(session.user.id);
        } else {
          this.user = null;
          this.profile = null;
        }
      });
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      this.loading = false;
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

      if (error) throw error;
      
      console.log('Profile created successfully:', data);
      this.profile = data;
    } catch (err) {
      console.error('Profile creation error:', err);
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
          }
        }
      });

      if (error) throw error;

      // Profile will be created by database trigger or in loadProfile
      if (data.user) {
        // Wait a bit for trigger to execute
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
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Sign out failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async updateProfile(updates: Partial<Profile>) {
    if (!this.user) return;

    this.loading = true;
    this.error = null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', this.user.id);

      if (error) throw error;

      this.profile = { ...this.profile!, ...updates };
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Update failed';
      throw err;
    } finally {
      this.loading = false;
    }
  }
}

export const auth = new AuthStore();
