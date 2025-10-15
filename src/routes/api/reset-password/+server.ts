import { json } from '@sveltejs/kit';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST({ request }: RequestEvent) {
  try {
    const { email, token, newPassword } = await request.json();

    // Validate input
    if (!email || !token || !newPassword) {
      return json({ 
        error: 'Email, token, and new password are required' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    console.log(`Password reset attempt for: ${cleanEmail}`);

    // Verify the user exists in profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', cleanEmail)
      .single();

    if (profileError || !profile) {
      console.error('User not found in profiles:', cleanEmail);
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Get the auth user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const user = users.find(u => u.email?.toLowerCase() === cleanEmail);
    
    if (!user) {
      console.error('Auth user not found:', cleanEmail);
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Update the password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      throw updateError;
    }

    console.log('Password reset successful for:', cleanEmail);

    return json({ 
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return json({ 
      error: error.message || 'Failed to reset password. Please try again.' 
    }, { status: 500 });
  }
}
