<script lang="ts">
  interface Props {
    value?: string | number;
    options: Array<{ value: string | number; label: string }>;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
    error?: string;
    class?: string;
    onchange?: (e: Event) => void;
  }

  let {
    value = $bindable(''),
    options,
    placeholder = 'Select an option',
    disabled = false,
    required = false,
    label,
    error,
    class: className = '',
    onchange
  }: Props = $props();

  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = $derived(
    `w-full px-4 py-3 border-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
    } ${className}`
  );
</script>

<div class="w-full">
  {#if label}
    <label for={selectId} class="block text-sm font-semibold text-gray-700 mb-2">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <select
    id={selectId}
    bind:value
    {disabled}
    {required}
    class={selectClasses}
    onchange={onchange}
  >
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  
  {#if error}
    <p class="mt-2 text-sm text-red-600 font-medium">{error}</p>
  {/if}
</div>
