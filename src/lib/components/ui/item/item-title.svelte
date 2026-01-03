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
	class={cn("flex w-fit items-center gap-2 text-sm leading-snug font-medium", className)}
	data-slot="item-title"
	{...restProps}
>
	{@render children?.()}
</div>
