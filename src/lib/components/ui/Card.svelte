<script lang="ts">
  interface Props {
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    class?: string;
    children?: any;
  }

  let {
    hover = false,
    padding = 'md',
    class: className = '',
    children
  }: Props = $props();

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const cardClasses = $derived(
    `bg-white rounded-lg border border-gray-200 ${paddingClasses[padding]} ${
      hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : 'shadow-sm'
    } ${className}`
  );
</script>

<div class={cardClasses}>
  {@render children?.()}
</div>
