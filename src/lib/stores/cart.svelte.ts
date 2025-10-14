import { supabase } from '$lib/utils/supabase';
import type { CartItem } from '$lib/types';

class CartStore {
  items = $state<CartItem[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce((sum, item) => {
      const product = item.product;
      if (!product) return sum;
      
      const basePrice = product.base_price;
      const variantPrice = item.variant ? item.variant.price_modifier : 0;
      const totalPrice = basePrice + variantPrice;
      
      return sum + (totalPrice * item.quantity);
    }, 0);
  }

  get gstAmount() {
    return this.items.reduce((sum, item) => {
      const product = item.product;
      if (!product) return sum;
      
      const basePrice = product.base_price;
      const variantPrice = item.variant ? item.variant.price_modifier : 0;
      const totalPrice = basePrice + variantPrice;
      const gst = (totalPrice * product.gst_percentage) / 100;
      
      return sum + (gst * item.quantity);
    }, 0);
  }

  get transportCharges() {
    return this.items.reduce((sum, item) => {
      const product = item.product;
      if (!product) return sum;
      return sum + product.transport_charges;
    }, 0);
  }

  get total() {
    return this.subtotal + this.gstAmount + this.transportCharges;
  }

  async loadCart(userId: string) {
    this.loading = true;
    this.error = null;
    
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*,
            category:categories(*),
            variants:product_variants(*)
          ),
          variant:product_variants(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      this.items = data || [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load cart';
      console.error('Cart load error:', err);
    } finally {
      this.loading = false;
    }
  }

  async addItem(userId: string, productId: string, variantId: string | null, quantity: number = 1) {
    this.loading = true;
    this.error = null;

    try {
      // First, get the product to check stock
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, is_custom')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Check stock availability
      if (!productData.is_custom && productData.stock_quantity < quantity) {
        throw new Error(`Only ${productData.stock_quantity} units available`);
      }

      // Check if item already exists
      const existingItem = this.items.find(
        item => item.product_id === productId && item.variant_id === variantId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        
        // Validate total quantity
        if (!productData.is_custom && newQuantity > productData.stock_quantity) {
          throw new Error(`Cannot add more. Only ${productData.stock_quantity} units available`);
        }
        
        await this.updateQuantity(existingItem.id, newQuantity);
      } else {
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            product_id: productId,
            variant_id: variantId,
            quantity
          })
          .select(`
            *,
            product:products(*,
              category:categories(*),
              variants:product_variants(*)
            ),
            variant:product_variants(*)
          `)
          .single();

        if (error) throw error;
        if (data) this.items = [...this.items, data];
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to add item';
      console.error('Add to cart error:', err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async updateQuantity(cartItemId: string, quantity: number) {
    if (quantity < 1) {
      await this.removeItem(cartItemId);
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Get the cart item and product to check stock
      const cartItem = this.items.find(item => item.id === cartItemId);
      if (!cartItem || !cartItem.product) {
        throw new Error('Cart item not found');
      }

      // Validate stock
      if (!cartItem.product.is_custom && quantity > cartItem.product.stock_quantity) {
        throw new Error(`Only ${cartItem.product.stock_quantity} units available`);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      this.items = this.items.map(item =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update quantity';
      console.error('Update quantity error:', err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async removeItem(cartItemId: string) {
    this.loading = true;
    this.error = null;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      this.items = this.items.filter(item => item.id !== cartItemId);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to remove item';
      console.error('Remove from cart error:', err);
    } finally {
      this.loading = false;
    }
  }

  async clearCart(userId: string) {
    this.loading = true;
    this.error = null;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      this.items = [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to clear cart';
      console.error('Clear cart error:', err);
      throw err;
    } finally {
      this.loading = false;
    }
  }
}

export const cart = new CartStore();
