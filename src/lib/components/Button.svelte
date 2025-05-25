<script lang="ts">
  import { tv } from 'tailwind-variants';
  import { cn } from './utils';
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import type { VariantProps } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: 'inline-flex items-center justify-center px-4 py-2 active:scale-95 hover:cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  });

  type Props = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: VariantProps<typeof buttonVariants>['variant'];
    };

  let {
    children,
    ref = $bindable(null),
    variant = 'primary',
    href,
    class: className,
    'aria-busy': ariaBusy,
    ...restProps
  }: Props = $props();

  const isLoading = $derived(ariaBusy === true || ariaBusy === 'true');
</script>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
</style>

{#snippet buttonContent()}
  {#if isLoading}
    <svg class="spinner w-4 h-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" opacity="0.3" r="10" stroke="currentColor" stroke-dasharray="32" stroke-dashoffset="32" stroke-linecap="round" stroke-width="4"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-dasharray="8" stroke-dashoffset="8" stroke-linecap="round" stroke-width="4"/>
    </svg>
  {:else}
    {@render children?.()}
  {/if}
{/snippet}

{#if href}
  <a 
    bind:this={ref} 
    class={cn(buttonVariants({ variant }), className)} 
    aria-busy={isLoading}
    {...restProps} 
    {href}
  >
    {@render buttonContent()}
  </a>
{:else}
  <button 
    bind:this={ref} 
    class={cn(buttonVariants({ variant }), className)} 
    aria-busy={isLoading}
    disabled={isLoading}
    {...restProps}
  >
    {@render buttonContent()}
  </button>
{/if}
