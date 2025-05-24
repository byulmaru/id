<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  const { data } = $props();
  const { form, enhance } = superForm(data.form, {
    resetForm: false,
    onResult: ({ result }) => {
      console.log(result);
    },
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="flex w-full max-w-md flex-col gap-6 rounded-lg bg-white p-8 shadow-lg">
    <h1 class="mb-4 text-center text-2xl font-bold">코스모 시작하기</h1>
    <form class="flex flex-col gap-2" method="post" use:enhance>
      <TextInput
        name="email"
        class="mb-2"
        autocomplete="email"
        placeholder="이메일을 입력하세요"
        required
        type="email"
        bind:value={$form.email}
      />
      <Button class="w-full" type="submit">로그인 / 회원가입</Button>
    </form>
  </div>
</div>
