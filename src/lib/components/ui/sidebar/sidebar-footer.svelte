<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<div
	bind:this={ref}
	class={cn("flex flex-col gap-2 p-2", className)}
	data-sidebar="footer"
	data-slot="sidebar-footer"
	{...restProps}
>
	{@render children?.()}
</div>
