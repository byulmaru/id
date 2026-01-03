<script lang="ts">
  import { KeyRoundIcon, MailIcon, UserIcon } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import NavAccount from './NavAccount.svelte';

  type Props = {
    account: {
      name: string;
      primaryEmail: string;
    }
  };
  
  const { account }: Props = $props();
  const isActive = (href: string) => page.url.pathname === href;
</script>

<Sidebar.Root>
  <Sidebar.Header>
    <NavAccount {account} />
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>계정 설정</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton
              isActive={isActive('/settings/profile')}
            >
              {#snippet child({ props })}
              <a href={resolve('/(main)/settings/profile')} {...props}>
                <UserIcon/>
                <span>프로필</span>
              </a>
              {/snippet}
              
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton
              isActive={isActive('/settings/email')}
            >
              {#snippet child({ props })}
              <a href={resolve('/(main)/settings/email')} {...props}>
                <MailIcon/>
                <span>이메일</span>
              </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
          </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
    <Sidebar.Group>
      <Sidebar.GroupLabel>보안 설정</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <!-- <Sidebar.MenuItem>
            <Sidebar.MenuButton
              isActive={isActive('/password')}
            >
              {#snippet child({ props })}
              <a href="/password" {...props}>
                <LockIcon/>
                <span>비밀번호</span>
              </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem> -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={isActive('/passkey')}
          >
            {#snippet child({ props })}
            <a href={resolve('/(main)/settings/passkey')} {...props}>
              <KeyRoundIcon/>
              <span>패스키</span>
            </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <!-- <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={isActive('/passkey')}
          >
            {#snippet child({ props })}
            <a href="/otp" {...props}>
              <RectangleEllipsisIcon />
              <span>OTP</span>
            </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={isActive('/sessions')}
          >
            {#snippet child({ props })}
            <a href="/sessions" {...props}>
              <ListIcon/>
              <span>세션 목록</span>
            </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem> -->
      </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>