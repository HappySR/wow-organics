import { json } from '@sveltejs/kit';
import { supabase } from '$lib/utils/supabase';

import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url }: RequestEvent) {
  try {
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        address:addresses(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return json({ orders: data });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST({ request }: RequestEvent) {
  try {
    const orderData = await request.json();

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;

    return json({ order: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH({ request }: RequestEvent) {
  try {
    const { orderId, updates } = await request.json();

    if (!orderId) {
      return json({ error: 'Order ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return json({ order: data });
  } catch (error) {
    console.error('Error updating order:', error);
    return json({ error: 'Failed to update order' }, { status: 500 });
  }
}
