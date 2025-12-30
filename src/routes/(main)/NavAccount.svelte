<script lang="ts">
  import { ChevronsUpDownIcon, LogOutIcon } from '@lucide/svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { useSidebar } from '$lib/components/ui/sidebar';

  type Props = {
    account: {
      name: string;
      primaryEmail: string;
    }
  }

  const { account }: Props = $props();
  const sidebar = useSidebar();

</script>
<Sidebar.Menu>
  <Sidebar.MenuItem>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger class="w-full">
        <Sidebar.MenuButton class="flex justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" size="lg">
          <div class="grid flex-1 text-start text-sm leading-tight">
            <span class="truncate font-medium">{account.name}</span>
            <span class="truncate text-xs">{account.primaryEmail}</span>
          </div>
          <ChevronsUpDownIcon class="ms-auto size-4" />
        </Sidebar.MenuButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
      class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        align="start"
        side={sidebar.isMobile ? "bottom" : "right"}
        sideOffset={4}
        >
        <DropdownMenu.Group>
          <form action="/?/logout" method="post">
            <DropdownMenu.Item>
              <button class="flex flex-row items-center gap-2" type="submit">
                <LogOutIcon/>
                로그아웃  
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Sidebar.MenuItem>
</Sidebar.Menu>