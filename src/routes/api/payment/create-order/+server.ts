import { json } from '@sveltejs/kit';
import Razorpay from 'razorpay';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '$env/static/private';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const { amount, currency } = await request.json();

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        company: 'WOW! Organics'
      }
    };

    const order = await razorpay.orders.create(options);

    return json(order);
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return json({ error: 'Failed to create order' }, { status: 500 });
  }
}
