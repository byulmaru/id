<script lang="ts">
  import { superForm  } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { z } from 'zod';
  import type { addEmailSchema } from './schema';

  type Props = {
    form: SuperValidated<z.infer<typeof addEmailSchema>>;
    open: boolean;
    onSuccess: (email: { id: string; email: string }) => void;
  }

  let { form: formProps, open = $bindable(false), onSuccess }: Props = $props();
  const { form, errors, enhance, submitting } = superForm(formProps, {
    onUpdate: ({ result }) => {
      if (result.type === 'success') {
        onSuccess(result.data.email);
      }
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <form action="?/addEmail" method="post" use:enhance>
      <Dialog.Header>
        <Dialog.Title>새 이메일 추가</Dialog.Title>
      </Dialog.Header>
      <Field.Set class="my-4">
        <Field.Group>
          <Field.Field>
            <Field.Label for="email">이메일 주소</Field.Label>
            <Input 
              id="email"
              name="email"
              aria-invalid={!!$errors.email}
              autocomplete="email"
              placeholder="example@example.com"
              required
              type="email"
              bind:value={$form.email}
            />
            {#if $errors.email}
              <Field.Error>{$errors.email}</Field.Error>
            {/if}
          </Field.Field>
        </Field.Group>
      </Field.Set>
      <Dialog.Footer>
        <Button aria-busy={$submitting} type="submit">인증 메일 전송</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>