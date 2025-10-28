import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, email, fullName, phone } = await request.json();

    if (!userId || !email) {
      return json({ error: 'User ID and email are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanFullName = (fullName || '').trim();
    const cleanPhone = (phone || '').trim();

    console.log('Creating profile for:', cleanEmail);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // If check fails with anything other than "not found", return error
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Profile check error:', checkError);
      throw checkError;
    }

    // If profile exists, return it
    if (existingProfile) {
      console.log('Profile already exists');
      return json({ 
        profile: existingProfile, 
        message: 'Profile already exists' 
      });
    }

    // Create the profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: cleanEmail,
        full_name: cleanFullName,
        phone: cleanPhone,
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // If it's a duplicate key error, try to fetch and return the existing profile
      if (error.code === '23505') {
        console.log('Profile was created by trigger, fetching...');
        const { data: fetchedProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (fetchedProfile) {
          return json({ 
            profile: fetchedProfile, 
            message: 'Profile already exists' 
          });
        }
      }
      
      console.error('Profile creation error:', error);
      throw error;
    }

    console.log('✅ Profile created successfully');
    return json({ profile: data, message: 'Profile created successfully' });
  } catch (error) {
    console.error('Create profile API error:', error);
    return json({ 
      error: 'Failed to create profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
