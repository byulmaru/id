<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<p
	bind:this={ref}
	class={cn(
		"text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance",
		"[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
		className
	)}
	data-slot="item-description"
	{...restProps}
>
	{@render children?.()}
</p>
