import { json } from '@sveltejs/kit';
import crypto from 'crypto';
import { RAZORPAY_KEY_SECRET } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json(
        { 
          success: false, 
          message: 'Missing required payment verification fields' 
        }, 
        { status: 400 }
      );
    }

    // Generate signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Verify signature
    const isValid = generated_signature === razorpay_signature;

    console.log('Payment verification:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      isValid
    });

    if (isValid) {
      return json({ 
        success: true, 
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id
      });
    } else {
      return json({ 
        success: false, 
        message: 'Invalid payment signature' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Verification failed' 
    }, { status: 500 });
  }
}
