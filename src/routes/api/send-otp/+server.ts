import { json } from '@sveltejs/kit';
import { TWOFACTOR_API_KEY } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const { phone } = await request.json();

    const response = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`, {
      method: 'GET'
    });

    const result = await response.json();

    if (result.Status !== 'Success') {
      throw new Error('Failed to send OTP');
    }

    return json({ success: true, sessionId: result.Details });
  } catch (error: any) {
    console.error('OTP send error:', error);
    return json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
