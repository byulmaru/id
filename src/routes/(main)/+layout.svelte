<script lang="ts">
  import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar';
  import AppSidebar from './AppSidebar.svelte';

	const { children, data } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar account={data.account} />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger />
      <Separator class="me-2 data-[orientation=vertical]:h-4" orientation="vertical" />
    </header>
    <main class="w-full max-w-5xl mx-auto my-8">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
