import { json } from '@sveltejs/kit';
import { BREVO_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

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

export async function POST({ request }: RequestEvent) {
  try {
    const { orderId, oldStatus, newStatus, type } = await request.json();

    console.log(`Sending ${type} email for order:`, orderId);

    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        address:addresses(*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Error fetching order:', error);
      return json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', order.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error('User email not found');
      return json({ error: 'User email not found' }, { status: 404 });
    }

    const emailHtml = type === 'order_status' 
      ? generateOrderStatusEmailHTML(order, profile, oldStatus, newStatus)
      : generatePaymentStatusEmailHTML(order, profile, oldStatus, newStatus);

    const subject = type === 'order_status'
      ? `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${order.order_number}`
      : `Payment ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${order.order_number}`;

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'WOW! Organics', email: 'woworganics2024@gmail.com' },
        to: [{ email: profile.email, name: profile.full_name }],
        subject,
        htmlContent: emailHtml
      })
    });

    if (!brevoResponse.ok) {
      const errorDetails = await brevoResponse.text();
      console.error('Brevo error:', errorDetails);
      return json({ error: 'Failed to send email' }, { status: 500 });
    }

    const data = await brevoResponse.json();
    console.log('Email sent successfully');
    return json({ success: true, emailId: data?.messageId });

  } catch (error) {
    console.error('Email error:', error);
    return json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function generateOrderStatusEmailHTML(order: any, profile: any, oldStatus: string, newStatus: string): string {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    confirmed: {
      title: 'Order Confirmed! 🎉',
      message: 'Great news! Your order has been confirmed and is being prepared for shipment.',
      color: '#3b82f6'
    },
    processing: {
      title: 'Order Processing 📦',
      message: 'Your order is now being processed and will be shipped soon.',
      color: '#8b5cf6'
    },
    shipped: {
      title: 'Order Shipped! 🚚',
      message: 'Your order is on its way! Track your package to see its current location.',
      color: '#6366f1'
    },
    delivered: {
      title: 'Order Delivered! ✅',
      message: 'Your order has been successfully delivered. We hope you enjoy your products!',
      color: '#10b981'
    },
    cancelled: {
      title: 'Order Cancelled ❌',
      message: 'Your order has been cancelled. If you did not request this, please contact us immediately.',
      color: '#ef4444'
    }
  };

  const status = statusMessages[newStatus] || {
    title: 'Order Status Updated',
    message: `Your order status has been updated to: ${newStatus}`,
    color: '#6b7280'
  };

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.total_price).toFixed(2)}</td>
    </tr>
  `).join('');

  const deliveryDate = new Date(order.delivery_date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">WOW! Organics</h1>
        <p style="margin: 10px 0 0; font-size: 18px;">${status.title}</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-top: 0;">Dear ${profile.full_name || 'Customer'},</p>
        <p style="margin-bottom: 20px; font-size: 16px;">${status.message}</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${status.color};">
          <h2 style="margin-top: 0; color: ${status.color}; font-size: 20px;">Order Details</h2>
          <p style="margin: 8px 0;"><strong>Order Number:</strong> ${order.order_number}</p>
          <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: ${status.color}; font-weight: bold; text-transform: uppercase;">${newStatus}</span></p>
          <p style="margin: 8px 0;"><strong>Expected Delivery:</strong> ${deliveryDate}</p>
          <p style="margin: 8px 0;"><strong>Total Amount:</strong> ₹${Number(order.total_amount).toFixed(2)}</p>
        </div>

        <h3 style="color: #333; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Product</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Price</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        ${order.address ? `
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="margin-top: 0; color: #333; font-size: 18px;">Delivery Address</h3>
          <p style="margin: 5px 0;"><strong>${order.address.full_name}</strong></p>
          <p style="margin: 5px 0;">${order.address.phone}</p>
          <p style="margin: 5px 0;">${order.address.address_line1}</p>
          ${order.address.address_line2 ? `<p style="margin: 5px 0;">${order.address.address_line2}</p>` : ''}
          <p style="margin: 5px 0;">${order.address.city}, ${order.address.state} - ${order.address.pincode}</p>
        </div>
        ` : ''}

        <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Need Help?</h3>
          <p style="margin: 5px 0; font-size: 14px;">If you have any questions, please contact us:</p>
          <p style="margin: 5px 0; font-size: 14px;">📧 Email: support@woworganics.com</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px;">Thank you for choosing WOW! Organics!</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">© 2025 WOW! Organics. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentStatusEmailHTML(order: any, profile: any, oldStatus: string, newStatus: string): string {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    paid: {
      title: 'Payment Received! ✅',
      message: 'We have received your payment successfully. Your order will be processed shortly.',
      color: '#10b981'
    },
    failed: {
      title: 'Payment Failed ❌',
      message: 'Unfortunately, your payment could not be processed. Please try again or contact support.',
      color: '#ef4444'
    },
    pending: {
      title: 'Payment Pending ⏳',
      message: 'Your payment is pending. We will notify you once it is confirmed.',
      color: '#f59e0b'
    },
    refunded: {
      title: 'Payment Refunded 💰',
      message: 'Your payment has been refunded. It may take 5-7 business days to reflect in your account.',
      color: '#8b5cf6'
    }
  };

  const status = statusMessages[newStatus] || {
    title: 'Payment Status Updated',
    message: `Your payment status has been updated to: ${newStatus}`,
    color: '#6b7280'
  };

  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.total_price).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">WOW! Organics</h1>
        <p style="margin: 10px 0 0; font-size: 18px;">${status.title}</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-top: 0;">Dear ${profile.full_name || 'Customer'},</p>
        <p style="margin-bottom: 20px; font-size: 16px;">${status.message}</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${status.color};">
          <h2 style="margin-top: 0; color: ${status.color}; font-size: 20px;">Payment Details</h2>
          <p style="margin: 8px 0;"><strong>Order Number:</strong> ${order.order_number}</p>
          <p style="margin: 8px 0;"><strong>Payment Status:</strong> <span style="color: ${status.color}; font-weight: bold; text-transform: uppercase;">${newStatus}</span></p>
          <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}</p>
          <p style="margin: 8px 0;"><strong>Amount:</strong> ₹${Number(order.total_amount).toFixed(2)}</p>
        </div>

        <h3 style="color: #333; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Product</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px; color: #6b7280;">Subtotal:</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">₹${Number(order.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">GST:</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">₹${Number(order.gst_amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; color: #6b7280;">Transport:</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">₹${Number(order.transport_charges).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #d1d5db;">
              <td style="padding: 12px 8px; font-weight: bold; font-size: 18px;">Total:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 20px; color: ${status.color};">₹${Number(order.total_amount).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Need Help?</h3>
          <p style="margin: 5px 0; font-size: 14px;">If you have any questions, please contact us:</p>
          <p style="margin: 5px 0; font-size: 14px;">📧 Email: support@woworganics.com</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px;">Thank you for choosing WOW! Organics!</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">© 2025 WOW! Organics. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
