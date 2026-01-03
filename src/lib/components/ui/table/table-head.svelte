<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLThAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	class={cn(
		"text-foreground h-10 bg-clip-padding px-2 text-start align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pe-0",
		className
	)}
	data-slot="table-head"
	{...restProps}
>
	{@render children?.()}
</th>
