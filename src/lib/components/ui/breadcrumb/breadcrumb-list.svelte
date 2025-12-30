<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLOlAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLOlAttributes> = $props();
</script>

<ol
	bind:this={ref}
	class={cn(
		"text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
		className
	)}
	data-slot="breadcrumb-list"
	{...restProps}
>
	{@render children?.()}
</ol>
