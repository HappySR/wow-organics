import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    // Debug logs
    console.log('PUBLIC_SUPABASE_URL:', PUBLIC_SUPABASE_URL ? 'Present' : 'MISSING');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'MISSING');
    console.log('Checking email:', email);

    // Check if env variables exist
    if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables!');
      return json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create Supabase client with service role key to bypass RLS
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

    // Check if email exists in profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return json({ error: 'Database error', details: error.message }, { status: 500 });
    }

    console.log('Query result - User exists:', !!data);
    return json({ exists: !!data });
  } catch (error) {
    console.error('Check email error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
