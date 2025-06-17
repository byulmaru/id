<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import Button from '$lib/components/Button.svelte';
  import TextInput from '$lib/components/TextInput.svelte';

  const { data } = $props();
  const { form, enhance, submitting } = superForm(data.form, {
    resetForm: false,
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="flex w-full max-w-md flex-col gap-6 rounded-lg bg-white p-8 shadow-lg">
    <div class="text-center">
      <h1 class="text-2xl font-bold">회원가입</h1>
      <p class="mt-2 text-sm text-gray-500">
        {data.email}로 가입을 진행합니다
      </p>
    </div>

    <form class="flex flex-col gap-4" method="post" use:enhance>
      <!-- 이름 입력 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="name">
          이름
        </label>
        <TextInput
          id="name"
          name="name"
          placeholder="어떻게 불러드릴까요?"
          required
          type="text"
          bind:value={$form.name}
        />
      </div>

      <!-- 약관 동의 -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-gray-700">약관 동의</h3>
        
        <div class="space-y-2">
          <label class="flex items-start gap-2">
            <input
              name="termsAgreed"
              class="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              type="checkbox"
              bind:checked={$form.termsAgreed}
            />
            <span class="text-sm text-gray-700">
              <span class="text-red-500">*</span>
              <a class="text-indigo-600 hover:underline" href="/terms" target="_blank">
                서비스 이용약관
              </a>에 동의합니다
            </span>
          </label>

          <label class="flex items-start gap-2">
            <input
              name="privacyAgreed"
              class="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              type="checkbox"
              bind:checked={$form.privacyAgreed}
            />
            <span class="text-sm text-gray-700">
              <span class="text-red-500">*</span>
              <a class="text-indigo-600 hover:underline" href="/privacy" target="_blank">
                개인정보 처리방침
              </a>에 동의합니다
            </span>
          </label>
        </div>
      </div>

      <!-- 전체 동의 -->
      <label class="flex items-center gap-2 pt-2 border-t">
        <input
          class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          checked={$form.termsAgreed && $form.privacyAgreed}
          onchange={(e) => {
            const checked = e.currentTarget.checked;
            $form.termsAgreed = checked;
            $form.privacyAgreed = checked;
          }}
          type="checkbox"
        />
        <span class="text-sm font-medium text-gray-700">
          모든 약관에 동의합니다
        </span>
      </label>

      <Button 
        class="w-full mt-4" 
        aria-busy={$submitting} 
        disabled={!$form.name || !$form.termsAgreed || !$form.privacyAgreed}
        type="submit"
      >
        가입하기
      </Button>
    </form>
  </div>
</div> 