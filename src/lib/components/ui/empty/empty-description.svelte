<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		"text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
		className
	)}
	data-slot="empty-description"
	{...restProps}
>
	{@render children?.()}
</div>
