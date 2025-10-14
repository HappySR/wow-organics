import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(RESEND_API_KEY);

// Use service role key for server-side operations
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
    const { orderId } = await request.json();

    console.log('Sending email for order:', orderId);

    // Add a small delay to ensure DB transaction is committed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch order details using admin client
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        address:addresses(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return json({ error: 'Order not found', details: error }, { status: 404 });
    }

    if (!order) {
      console.error('Order is null for ID:', orderId);
      return json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('Order found:', order.order_number);

    // Get user email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', order.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error('User email not found for order:', orderId, profileError);
      return json({ error: 'User email not found' }, { status: 404 });
    }

    console.log('Sending email to:', profile.email);

    // Format delivery date
    const deliveryDate = new Date(order.delivery_date);
    const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const formattedOrderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Generate email HTML
    const emailHtml = generateOrderEmailHTML(order, profile, formattedDeliveryDate, formattedOrderDate);

    // Send email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: 'WOW! Organics <wow-organics.com>',
      to: [profile.email],
      subject: `Order Confirmation - ${order.order_number}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return json({ error: 'Failed to send email', details: emailError }, { status: 500 });
    }

    console.log('Email sent successfully:', data);
    return json({ success: true, emailId: data?.id });

  } catch (error) {
    console.error('Email error:', error);
    return json({ 
      error: 'Failed to send email', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

function generateOrderEmailHTML(
  order: any, 
  profile: any, 
  deliveryDate: string,
  orderDate: string
): string {
  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}${item.variant_name ? ` (${item.variant_name})` : ''}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${Number(item.total_price).toFixed(2)}</td>
    </tr>
  `).join('');

  const cancellationDeadline = new Date(order.created_at);
  cancellationDeadline.setHours(cancellationDeadline.getHours() + 48);
  const formattedCancellationDeadline = cancellationDeadline.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">WOW! Organics</h1>
        <p style="margin: 10px 0 0; font-size: 18px;">Order Confirmation</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-top: 0;">Dear ${profile.full_name || 'Customer'},</p>
        <p style="margin-bottom: 20px;">Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h2 style="margin-top: 0; color: #10b981; font-size: 20px;">Order Details</h2>
          <p style="margin: 8px 0;"><strong>Order Number:</strong> ${order.order_number}</p>
          <p style="margin: 8px 0;"><strong>Order Date:</strong> ${orderDate}</p>
          <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}</p>
          <p style="margin: 8px 0; font-size: 18px; color: #059669;"><strong>Expected Delivery:</strong> ${deliveryDate}</p>
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
              <td style="padding: 8px; color: #6b7280;">Transport Charges:</td>
              <td style="padding: 8px; text-align: right; font-weight: 600;">₹${Number(order.transport_charges).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #d1d5db;">
              <td style="padding: 12px 8px; font-weight: bold; font-size: 18px;">Total Amount:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 20px; color: #10b981;">₹${Number(order.total_amount).toFixed(2)}</td>
            </tr>
          </table>
        </div>

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

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>⚠️ Cancellation Policy:</strong> You can cancel this order before <strong>${formattedCancellationDeadline}</strong> (within 48 hours of placing the order).</p>
        </div>

        <div style="margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Need Help?</h3>
          <p style="margin: 5px 0; font-size: 14px;">If you have any questions about your order, please contact us:</p>
          <p style="margin: 5px 0; font-size: 14px;">📧 Email: support@woworganics.com</p>
          <p style="margin: 5px 0; font-size: 14px;">📱 Phone: +91-XXXXXXXXXX</p>
        </div>

        <p style="margin-top: 30px; font-size: 14px;">Thank you for choosing WOW! Organics!</p>
        <p style="margin-size: 14px; color: #6b7280;">We look forward to serving you again.</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">© 2025 WOW! Organics. All rights reserved.</p>
        <p style="margin: 5px 0;">This is an automated email. Please do not reply directly to this email.</p>
      </div>
    </body>
    </html>
  `;
}
