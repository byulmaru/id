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
      <CardTitle class="mb-4 text-center text-2xl">별마루 통합 ID</CardTitle>
    </CardHeader>
    <CardContent>
      <form class="flex flex-col gap-2" method="post" use:enhance>
        <FieldGroup>
          <Field>
            <FieldLabel for="email">이메일</FieldLabel>
            <Input
              id="email"
              name="email"
              autocomplete="email webauthn"
              placeholder="이메일을 입력하세요"
              required
              type="email"
              bind:value={$form.email}
            />
          </Field>
          <Button class="w-full" aria-busy={$submitting} type="submit">시작하기</Button>
        </FieldGroup>
      </form>
    </CardContent>
  </Card>
</div>
