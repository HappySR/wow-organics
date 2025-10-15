import { json } from '@sveltejs/kit';
import { BREVO_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST({ request }: RequestEvent) {
  try {
    const { email } = await request.json();

    if (!email) {
      return json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('email', cleanEmail)
      .single();

    if (!profile) {
      return json({ error: 'No account found with this email address' }, { status: 404 });
    }

    // Clean up old/expired OTPs for this email
    await supabaseAdmin
      .from('email_otps')
      .delete()
      .eq('email', cleanEmail);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`Generating OTP for ${cleanEmail}: ${otp}`);

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from('email_otps')
      .insert({
        email: cleanEmail,
        otp,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      throw new Error('Failed to generate OTP');
    }

    // Send OTP via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'WOW! Organics', email: 'woworganics2024@gmail.com' },
        to: [{ email: cleanEmail, name: profile.full_name }],
        subject: 'Password Reset OTP - WOW! Organics',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">WOW! Organics</h1>
              <p style="margin: 10px 0 0; font-size: 18px;">Password Reset Request</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; margin-top: 0;">Hello ${profile.full_name || 'there'},</p>
              <p style="margin-bottom: 20px;">We received a request to reset your password. Use the OTP below to proceed:</p>
              
              <div style="background: #f0fdf4; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px dashed #10b981;">
                <p style="margin: 0 0 10px; color: #059669; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                <h1 style="margin: 0; color: #10b981; font-size: 48px; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>⏰ Valid for 10 minutes</strong></p>
                <p style="margin: 5px 0 0; font-size: 14px;">This OTP will expire at ${expiresAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>🔒 Security Notice:</strong></p>
                <p style="margin: 5px 0 0; font-size: 14px;">If you didn't request this password reset, please ignore this email or contact our support team immediately.</p>
              </div>

              <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Need Help?</h3>
                <p style="margin: 5px 0; font-size: 14px;">📧 Email: support@woworganics.com</p>
                <p style="margin: 5px 0; font-size: 14px;">📱 Phone: +91-XXXXXXXXXX</p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">Best regards,<br>The WOW! Organics Team</p>
            </div>

            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p style="margin: 5px 0;">© 2025 WOW! Organics. All rights reserved.</p>
              <p style="margin: 5px 0;">This is an automated email. Please do not reply directly to this email.</p>
            </div>
          </body>
          </html>
        `
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo API error:', errorText);
      throw new Error('Failed to send email. Please try again.');
    }

    console.log('OTP email sent successfully to:', cleanEmail);

    // In development, return the OTP for testing
    if (dev) {
      return json({ 
        success: true, 
        debug_otp: otp,
        message: 'OTP sent successfully' 
      });
    }

    return json({ success: true, message: 'OTP sent to your email' });

  } catch (error: any) {
    console.error('Send email OTP error:', error);
    return json({ 
      error: error.message || 'Failed to send OTP. Please try again.' 
    }, { status: 500 });
  }
}
