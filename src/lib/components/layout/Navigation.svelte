<script lang="ts">
  import { page } from '$app/stores';

  interface NavItem {
    label: string;
    href: string;
  }

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Products', href: '/products' },
    { label: 'Projects', href: '/projects' },
    { label: 'Training', href: '/training' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Reviews', href: '/reviews' }
  ];

  function isActive(href: string): boolean {
    if (href === '/') {
      return $page.url.pathname === '/';
    }
    return $page.url.pathname.startsWith(href);
  }
</script>

<nav class="flex items-center space-x-8">
  {#each navItems as item}
    <a
      href={item.href}
      class={`text-sm font-medium transition-colors ${
        isActive(item.href)
          ? 'text-primary-600'
          : 'text-gray-700 hover:text-primary-600'
      }`}
    >
      {item.label}
    </a>
  {/each}
</nav>
