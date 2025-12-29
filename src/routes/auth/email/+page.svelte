<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';

  const { data } = $props();
  const { form, enhance, submitting } = superForm(data.form, {
    resetForm: false,
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-center text-2xl">인증번호 입력</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-center text-sm text-gray-500 mb-6">
        {data.email} 으로 전송된 인증번호를 입력해주세요.
      </p>
      <form class="flex flex-col gap-2" method="post" use:enhance>
        <input name="verificationId" type="hidden" bind:value={$form.verificationId} />
        <FieldGroup>
          <Field>
            <FieldLabel for="code">인증번호</FieldLabel>
            <Input
              id="code"
              name="code"
              inputmode="numeric"
              maxlength={6}
              placeholder="인증번호 6자리를 입력하세요"
              required
              type="text"
              bind:value={$form.code}
            />
          </Field>
          <Button class="w-full" aria-busy={$submitting} type="submit">인증하기</Button>
        </FieldGroup>
      </form>
    </CardContent>
  </Card>
</div>
