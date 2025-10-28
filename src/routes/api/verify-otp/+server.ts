import { json } from '@sveltejs/kit';
import { TWOFACTOR_API_KEY } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const { sessionId, otp } = await request.json();

    // FIX: Use proper template string syntax
    const response = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`, {
      method: 'GET'
    });

    const result = await response.json();

    if (result.Status !== 'Success') {
      throw new Error('Invalid OTP');
    }

    return json({ success: true });
  } catch (error: any) {
    console.error('OTP verify error:', error);
    return json({ error: error.message || 'Invalid OTP' }, { status: 500 });
  }
}
