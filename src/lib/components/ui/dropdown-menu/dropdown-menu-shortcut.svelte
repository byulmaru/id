<script lang="ts">
	import { cn  } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	class={cn("text-muted-foreground ms-auto text-xs tracking-widest", className)}
	data-slot="dropdown-menu-shortcut"
	{...restProps}
>
	{@render children?.()}
</span>
