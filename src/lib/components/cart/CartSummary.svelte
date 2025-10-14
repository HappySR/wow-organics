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

<div class="bg-white rounded-xl border border-gray-200 shadow-lg p-6 sticky top-24">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
  
  <div class="space-y-4 mb-6">
    <div class="flex justify-between text-gray-600">
      <span class="font-medium">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
      <span class="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
    </div>
    
    <div class="flex justify-between text-gray-600">
      <span class="font-medium">GST (18%)</span>
      <span class="font-semibold text-gray-900">{formatCurrency(gstAmount)}</span>
    </div>
    
    <div class="flex justify-between text-gray-600">
      <span class="font-medium">Transport Charges</span>
      <span class="font-semibold text-gray-900">{formatCurrency(transportCharges)}</span>
    </div>
    
    <div class="border-t-2 border-gray-200 pt-4 mt-2">
      <div class="flex justify-between items-baseline">
        <span class="text-lg font-bold text-gray-900">Total Amount</span>
        <span class="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  </div>

  <Button
    fullWidth
    size="lg"
    onclick={onCheckout}
    loading={loading}
  >
    {loading ? 'Processing...' : 'Proceed to Checkout'}
  </Button>

  <p class="text-xs text-gray-500 mt-4 text-center leading-relaxed">
    All taxes included • Secure checkout
  </p>
</div>
