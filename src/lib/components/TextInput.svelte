<script lang="ts">
  import { tv } from 'tailwind-variants';
  import { cn } from './utils';
  import type { WithElementRef } from 'bits-ui';
  import type { HTMLInputAttributes } from 'svelte/elements';

  export const inputVariants = tv({
    base: 'block w-full border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  });

  type Props = WithElementRef<HTMLInputAttributes> & {
    class?: string;
    name?: string;
    type?: string;
    value?: string;
    id?: string;
  };

  let {
    class: className = '',
    name = '',
    type = 'text',
    value = $bindable(''),
    id = '',
    ref = $bindable(null),
    ...restProps
  }: Props = $props();
</script>

<input
  bind:this={ref}
  id={id || name}
  {name}
  class={cn(inputVariants(), className)}
  {type}
  bind:value
  {...restProps}
/>
