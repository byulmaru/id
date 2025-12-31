<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import * as Field from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';

  const { data } = $props();
  const { form, enhance, submitting, errors } = superForm(data.form, {
    resetForm: false,
  });
</script>

<form class="flex flex-col gap-4" method="post" use:enhance>
  <Field.Group>
    <Field.Set>
      <Field.Legend>프로필 설정</Field.Legend>
      <Field.Separator />
      <Field.Group>
        <Field.Field>
          <Field.Label for="name">닉네임</Field.Label>
          <Input 
            id="name"
            name="name"
            aria-invalid={!!$errors.name}
            autocomplete="nickname"
            placeholder="닉네임을 입력하세요"
            required
            type="text"
            bind:value={$form.name}
          />
          {#if $errors.name}
            <Field.Error>{$errors.name}</Field.Error>
          {/if}
        </Field.Field>
      </Field.Group>
    </Field.Set>
    <Field.Field orientation="horizontal">
      <Button aria-busy={$submitting} type="submit">저장</Button>
    </Field.Field>
  </Field.Group>
</form>

