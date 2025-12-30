<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "legend",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLLegendElement>> & {
		variant?: "legend" | "label";
	} = $props();
</script>

<legend
	bind:this={ref}
	class={cn(
		"mb-3 font-medium",
		"data-[variant=legend]:text-base",
		"data-[variant=label]:text-sm",
		className
	)}
	data-slot="field-legend"
	data-variant={variant}
	{...restProps}
>
	{@render children?.()}
</legend>
