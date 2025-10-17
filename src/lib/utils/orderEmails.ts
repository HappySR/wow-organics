export async function sendOrderStatusEmail(orderId: string, oldStatus: string, newStatus: string) {
  try {
    const response = await fetch('/api/send-status-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId, 
        oldStatus, 
        newStatus,
        type: 'order_status'
      })
    });

    if (!response.ok) {
      console.error('Failed to send status email');
    }
  } catch (error) {
    console.error('Error sending status email:', error);
  }
}

export async function sendPaymentStatusEmail(orderId: string, oldStatus: string, newStatus: string) {
  try {
    const response = await fetch('/api/send-status-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId, 
        oldStatus, 
        newStatus,
        type: 'payment_status'
      })
    });

    if (!response.ok) {
      console.error('Failed to send payment status email');
    }
  } catch (error) {
    console.error('Error sending payment status email:', error);
  }
}
