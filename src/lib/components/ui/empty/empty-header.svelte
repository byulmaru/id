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
	class={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
	data-slot="empty-header"
	{...restProps}
>
	{@render children?.()}
</div>
