<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth.svelte';
  import { cart } from '$lib/stores/cart.svelte';
  import { requireAuth } from '$lib/utils/guards';
  import { formatCurrency } from '$lib/utils/helpers';
  import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let authChecking = $state(true);

  onMount(async () => {
    const canAccess = await requireAuth();
    authChecking = false;
    
    if (!canAccess) {
      goto('/auth/login');
    }
  });

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    await cart.updateQuantity(itemId, newQuantity);
  };

  const removeItem = async (itemId: string) => {
    await cart.removeItem(itemId);
  };
</script>

<svelte:head>
  <title>Shopping Cart - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50 min-h-screen py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

    {#if cart.loading}
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading cart...</p>
      </div>
    {:else if cart.items.length === 0}
      <Card>
        <div class="text-center py-12">
          <ShoppingBag size={64} class="mx-auto text-gray-400 mb-4" />
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p class="text-gray-600 mb-6">Add some products to get started</p>
          <Button onclick={() => goto('/products')}>
            Continue Shopping
          </Button>
        </div>
      </Card>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Cart Items -->
        <div class="lg:col-span-2 space-y-4">
          {#each cart.items as item}
            {@const product = item.product}
            {@const variant = item.variant}
            {@const price = product ? product.base_price + (variant?.price_modifier || 0) : 0}
            {@const itemTotal = price * item.quantity}
            
            <Card>
              <div class="flex flex-col sm:flex-row gap-4">
                <!-- Product Image -->
                <div class="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {#if product?.image_url}
                    <img
                      src={product.image_url}
                      alt={product.name}
                      class="w-full h-full object-cover"
                    />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag size={32} />
                    </div>
                  {/if}
                </div>

                <!-- Product Details -->
                <div class="flex-1">
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">
                        {product?.name || 'Product'}
                      </h3>
                      {#if variant}
                        <p class="text-sm text-gray-600">
                          {variant.variant_name}: {variant.variant_value}
                        </p>
                      {/if}
                    </div>
                    <button
                      onclick={() => removeItem(item.id)}
                      class="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div class="flex items-center justify-between mt-4">
                    <!-- Quantity Controls -->
                    <div class="flex items-center space-x-2">
                      <button
                        onclick={() => updateQuantity(item.id, item.quantity - 1)}
                        class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span class="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onclick={() => updateQuantity(item.id, item.quantity + 1)}
                        class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <!-- Price -->
                    <div class="text-right">
                      <p class="text-sm text-gray-600">
                        {formatCurrency(price)} × {item.quantity}
                      </p>
                      <p class="text-lg font-bold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          {/each}
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <Card class="sticky top-24">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div class="space-y-3 mb-6">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              
              <div class="flex justify-between text-gray-600">
                <span>GST (18%)</span>
                <span>{formatCurrency(cart.gstAmount)}</span>
              </div>
              
              <div class="flex justify-between text-gray-600">
                <span>Transport Charges</span>
                <span>{formatCurrency(cart.transportCharges)}</span>
              </div>
              
              <div class="border-t border-gray-200 pt-3">
                <div class="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(cart.total)}</span>
                </div>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              onclick={() => goto('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <button
              onclick={() => goto('/products')}
              class="w-full mt-3 text-primary-600 hover:text-primary-700 font-medium"
            >
              Continue Shopping
            </button>
          </Card>
        </div>
      </div>
    {/if}
  </div>
</div>
