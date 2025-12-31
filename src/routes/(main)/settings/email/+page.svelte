<script lang="ts">
  import { BadgeCheckIcon, BadgeXIcon, EllipsisIcon, MailPlusIcon, StarIcon, TrashIcon } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import AddEmailDialog from './AddEmailDialog.svelte';
  import VerifyEmailDialog from './VerifyEmailDialog.svelte';

	const { data } = $props();

  let addEmailDialogOpen = $state(false);
  let verifyEmailDialogOpen = $state(false);
  let verifyEmail: { id: string; email: string } | null = $state(null);

  const openVerifyEmailDialog = (email: { id: string; email: string }) => {
    verifyEmail = email;
    addEmailDialogOpen = false;
    verifyEmailDialogOpen = true;
  };

</script>

<div class="flex flex-col gap-6">
	<Table>
    <TableHeader>
      <TableRow>
        <TableHead >이메일 목록</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each data.emails as email (email.id)}
        <TableRow>
          <TableCell class="flex flex-row justify-between">
            <div class="flex items-center gap-2">
              <span class="font-medium">{email.email}</span>
              {#if email.isPrimary}
                <Badge>
                  <StarIcon/>
                  <span>주 이메일</span>
                </Badge>
              {/if}
              {#if email.verifiedAt}
                <Badge variant="outline">
                  <BadgeCheckIcon />
                  <span>인증됨</span>
                </Badge>
              {:else}
                <Badge variant="destructive">
                  <BadgeXIcon />
                  <span>인증되지 않음</span>
                </Badge>
              {/if}
            </div>
            <div>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button class="rounded-full" size="icon" variant="ghost">
                    <EllipsisIcon/>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Group>
                    {#if !email.isPrimary && email.verifiedAt}
                      <form action="?/setPrimary" method="post">
                        <DropdownMenu.Item>
                          <button class="w-full text-left flex flex-row items-center gap-2" type="submit">
                            <StarIcon/>
                            <span>주 이메일로 설정</span>
                          </button>
                        </DropdownMenu.Item>
                        <input name="emailId" type="hidden" value={email.id} />
                      </form>
                    {:else if !email.verifiedAt}
                      <DropdownMenu.Item>
                        <button class="w-full text-left flex flex-row items-center gap-2" onclick={() => openVerifyEmailDialog(email)} type="button">
                          <BadgeCheckIcon/>
                          <span>인증하기</span>
                        </button>
                      </DropdownMenu.Item>
                    {/if}
                    <form action="?/deleteEmail" method="post">
                      <input name="emailId" type="hidden" value={email.id} />
                      <DropdownMenu.Item class="flex flex-col" disabled={email.isPrimary} variant="destructive">
                        <button class="w-full text-left flex flex-row items-center gap-2" type="submit">
                          <TrashIcon/>
                          <span>삭제</span>
                        </button>
                        {#if email.isPrimary}
                          <span class="text-xs text-muted-foreground">주 이메일은 삭제할 수 없어요</span>
                        {/if}
                      </DropdownMenu.Item>
                    </form>
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>

	<!-- 새 이메일 추가 -->
	<Button onclick={() => addEmailDialogOpen = true}>
    <MailPlusIcon/>
    <span>새 이메일 추가</span>
  </Button>
  <AddEmailDialog form={data.addEmailForm} onSuccess={openVerifyEmailDialog} bind:open={addEmailDialogOpen} />
  <VerifyEmailDialog email={verifyEmail} form={data.verifyEmailForm} bind:open={verifyEmailDialogOpen} />
</div>
