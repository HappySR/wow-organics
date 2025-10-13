import { PUBLIC_RAZORPAY_KEY_ID } from '$env/static/public';

export interface RazorpayOptions {
  amount: number;
  currency: string;
  orderId: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  onSuccess: (response: any) => void;
  onFailure: (error: any) => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiatePayment(options: RazorpayOptions) {
  const loaded = await loadRazorpayScript();
  
  if (!loaded) {
    throw new Error('Razorpay SDK failed to load');
  }

  const razorpayOptions = {
    key: PUBLIC_RAZORPAY_KEY_ID,
    amount: options.amount * 100, // Convert to paise
    currency: options.currency,
    name: 'WOW! Organics',
    description: options.description,
    order_id: options.orderId,
    prefill: {
      name: options.name,
      email: options.email,
      contact: options.phone
    },
    theme: {
      color: '#16a34a'
    },
    handler: function (response: any) {
      options.onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        options.onFailure({ message: 'Payment cancelled by user' });
      }
    }
  };

  const razorpay = new (window as any).Razorpay(razorpayOptions);
  
  razorpay.on('payment.failed', function (response: any) {
    options.onFailure(response.error);
  });

  razorpay.open();
}

export async function createRazorpayOrder(amount: number, currency: string = 'INR') {
  const response = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount, currency })
  });

  if (!response.ok) {
    throw new Error('Failed to create Razorpay order');
  }

  return response.json();
}

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })
  });

  if (!response.ok) {
    throw new Error('Payment verification failed');
  }

  return response.json();
}
