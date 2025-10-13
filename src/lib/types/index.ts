// Database Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  category_id: string;
  is_custom: boolean;
  stock_quantity: number;
  gst_percentage: number;
  transport_charges: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price_modifier: number;
  stock_quantity: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  address_id: string;
  subtotal: number;
  gst_amount: number;
  transport_charges: number;
  total_amount: number;
  payment_method: 'online' | 'cod';
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
  address?: Address;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  gst_amount: number;
  total_price: number;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
  user?: { full_name: string | null };
  product?: { name: string; slug: string };
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  duration_hours: number | null;
  max_participants: number | null;
  price: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface TrainingEnrollment {
  id: string;
  course_id: string;
  trainee_id: string;
  enrollment_date: string;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  certificate_url: string | null;
  created_at: string;
  course?: TrainingCourse;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'admin' | 'instructor' | 'trainee';
  created_at: string;
}

// Utility Types
export interface PriceBreakdown {
  subtotal: number;
  gst: number;
  transport: number;
  total: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
