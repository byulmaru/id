<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  const { data } = $props();
  const { form, enhance, submitting } = superForm(data.form, {
    resetForm: false,
    onResult: ({ result }) => {
      console.log(result);
    },
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="flex w-full max-w-md flex-col gap-6 rounded-lg bg-white p-8 shadow-lg">
    <h1 class="text-center text-2xl font-bold">인증번호 입력</h1>
    <p class="text-center text-sm text-gray-500">
      {data.email} 으로 전송된 인증번호를 입력해주세요.
    </p>
    <form class="flex flex-col gap-2" method="post" use:enhance>
      <input name="verificationId" type="hidden" bind:value={$form.verificationId} />
      <TextInput
        name="code"
        class="mb-2"
        autocomplete="one-time-code"
        maxlength={6}
        placeholder="인증번호 6자리를 입력하세요"
        required
        type="text"
        bind:value={$form.code}
      />
      <Button class="w-full" aria-busy={$submitting} type="submit">인증하기</Button>
    </form>
  </div>
</div>
