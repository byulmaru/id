<script lang="ts">
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import { cn   } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
import type {WithElementRef, WithoutChildren} from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLSpanElement>>> = $props();
</script>

<span
	bind:this={ref}
	class={cn("flex size-9 items-center justify-center", className)}
	aria-hidden="true"
	data-slot="breadcrumb-ellipsis"
	role="presentation"
	{...restProps}
>
	<EllipsisIcon class="size-4" />
	<span class="sr-only">More</span>
</span>
