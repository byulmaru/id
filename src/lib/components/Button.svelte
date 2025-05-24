

<script lang="ts">
  import { tv } from 'tailwind-variants';
  import { cn } from './utils';
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import type { VariantProps } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: 'inline-flex items-center justify-center px-4 py-2 active:scale-95 hover:cursor-pointer ',
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
    ...restProps
  }: Props = $props();
</script>

{#if href}
  <a bind:this={ref} class={cn(buttonVariants({ variant }), className)} {...restProps} {href}>
    {@render children?.()}
  </a>
{:else}
  <button bind:this={ref} class={cn(buttonVariants({ variant }), className)} {...restProps}>
    {@render children?.()}
  </button>
{/if}
