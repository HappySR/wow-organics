import { json } from '@sveltejs/kit';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST({ request }: RequestEvent) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Clean and validate OTP format
    const cleanOtp = otp.toString().trim().replace(/\s/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return json({ error: 'OTP must be exactly 6 digits' }, { status: 400 });
    }

    console.log(`Verifying OTP for: ${cleanEmail}`);

    // Fetch the OTP record
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('email_otps')
      .select('*')
      .eq('email', cleanEmail)
      .eq('otp', cleanOtp)
      .single();

    if (fetchError || !otpRecord) {
      console.error('OTP verification failed - not found:', cleanEmail);
      return json({ 
        error: 'Invalid OTP. Please check the code and try again.' 
      }, { status: 400 });
    }

    // Check if OTP has expired
    const expiresAt = new Date(otpRecord.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      console.log('OTP expired for:', cleanEmail);
      
      // Delete expired OTP
      await supabaseAdmin
        .from('email_otps')
        .delete()
        .eq('email', cleanEmail);

      return json({ 
        error: 'OTP has expired. Please request a new one.' 
      }, { status: 400 });
    }

    // OTP is valid - delete it (one-time use)
    const { error: deleteError } = await supabaseAdmin
      .from('email_otps')
      .delete()
      .eq('email', cleanEmail)
      .eq('otp', cleanOtp);

    if (deleteError) {
      console.error('Error deleting used OTP:', deleteError);
    }

    // Generate a secure reset token
    const resetToken = crypto.randomUUID();
    
    console.log('OTP verified successfully for:', cleanEmail);
    
    return json({ 
      success: true, 
      token: resetToken,
      message: 'OTP verified successfully'
    });

  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return json({ 
      error: 'An error occurred during verification. Please try again.' 
    }, { status: 500 });
  }
}
