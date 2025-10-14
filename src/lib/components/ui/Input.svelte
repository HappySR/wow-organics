<script lang="ts">
  interface Props {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
    error?: string;
    class?: string;
    id?: string;
    name?: string;
    min?: number;
    max?: number;
    step?: number;
    onkeypress?: (event: KeyboardEvent) => void;
    onblur?: (event: FocusEvent) => void;
  }

  let {
    type = 'text',
    value = $bindable(''),
    placeholder,
    disabled = false,
    required = false,
    label,
    error,
    class: className = '',
    id,
    name,
    min,
    max,
    step,
    onkeypress,
    onblur
  }: Props = $props();

  const inputId = $derived(id || name || `input-${Math.random().toString(36).substr(2, 9)}`);

  const inputClasses = $derived(
    `w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
    } ${className}`
  );
</script>

<div class="w-full">
  {#if label}
    <label for={inputId} class="block text-sm font-semibold text-gray-700 mb-2">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    {type}
    bind:value
    {placeholder}
    {disabled}
    {required}
    {name}
    {min}
    {max}
    {step}
    id={inputId}
    class={inputClasses}
    {onkeypress}
    {onblur}
  />
  
  {#if error}
    <p class="mt-2 text-sm text-red-600 font-medium">{error}</p>
  {/if}
</div>
