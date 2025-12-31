<script lang="ts">
  import { superForm  } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as InputOTP from '$lib/components/ui/input-otp';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { verifyEmailSchema } from './schema';

  type Props = {
    form: SuperValidated<z.infer<typeof verifyEmailSchema>>;
    open: boolean;
    email: { id: string; email: string } | null;
  }

  let { form: formProps, open = $bindable(false), email }: Props = $props();
  const { form, errors, enhance, submitting } = superForm(formProps, {
    onUpdate: ({ result }) => {
      if (result.type === 'success') {
        open = false;
      }
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <form action="?/verifyEmail" method="post" use:enhance>
      <Dialog.Header>
        <Dialog.Title>이메일 인증</Dialog.Title>
        <Dialog.Description>
          {email?.email} 으로 전송된 인증번호를 입력해주세요.
        </Dialog.Description>
      </Dialog.Header>
      <input name="emailId" type="hidden" value={email?.id} />
      <div class="flex justify-center items-center py-8">
        <InputOTP.Root name="code" maxlength={6} bind:value={$form.code}>
          {#snippet children({ cells })}
            <InputOTP.Group>
              {#each cells as cell (cell)}
                <InputOTP.Slot {cell} />
              {/each}
            </InputOTP.Group>
          {/snippet}
        </InputOTP.Root>
      </div>
      {#if $errors.code}
        <p class="text-sm text-red-500">{$errors.code}</p>
      {/if}
      <Dialog.Footer>
        <Button aria-busy={$submitting} type="submit">인증</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>