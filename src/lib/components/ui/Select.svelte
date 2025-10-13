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
    `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${className}`
  );
</script>

<div class="w-full">
  {#if label}
    <label for={selectId} class="block text-sm font-medium text-gray-700 mb-1">
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
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>
