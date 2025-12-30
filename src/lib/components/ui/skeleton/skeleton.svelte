<script lang="ts">
	import { cn   } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef, WithoutChildren} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
	bind:this={ref}
	class={cn("bg-accent animate-pulse rounded-md", className)}
	data-slot="skeleton"
	{...restProps}
></div>
