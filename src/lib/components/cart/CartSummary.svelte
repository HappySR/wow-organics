<script lang="ts">
  import { formatCurrency } from '$lib/utils/helpers';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    subtotal: number;
    gstAmount: number;
    transportCharges: number;
    total: number;
    totalItems: number;
    onCheckout: () => void;
    loading?: boolean;
  }

  let {
    subtotal,
    gstAmount,
    transportCharges,
    total,
    totalItems,
    onCheckout,
    loading = false
  }: Props = $props();
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
  <h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
  
  <div class="space-y-3 mb-6">
    <div class="flex justify-between text-gray-600">
      <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
      <span class="font-medium">{formatCurrency(subtotal)}</span>
    </div>
    
    <div class="flex justify-between text-gray-600">
      <span>GST (18%)</span>
      <span class="font-medium">{formatCurrency(gstAmount)}</span>
    </div>
    
    <div class="flex justify-between text-gray-600">
      <span>Transport Charges</span>
      <span class="font-medium">{formatCurrency(transportCharges)}</span>
    </div>
    
    <div class="border-t border-gray-200 pt-3">
      <div class="flex justify-between text-lg font-bold text-gray-900">
        <span>Total</span>
        <span class="text-primary-600">{formatCurrency(total)}</span>
      </div>
    </div>
  </div>

  <Button
    fullWidth
    size="lg"
    onclick={onCheckout}
    loading={loading}
  >
    Proceed to Checkout
  </Button>

  <p class="text-xs text-gray-500 mt-4 text-center">
    Taxes and shipping calculated at checkout
  </p>
</div>
