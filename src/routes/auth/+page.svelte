<script lang="ts" module>
  /* eslint-disable @typescript-eslint/no-namespace */
  declare global {
    namespace App {
      interface PageState {
        phase: 'PASSKEY' | 'SELECT_METHOD' | undefined;
      }
    }
  }

  type StartPasskeyAuthenticationParams = {
    optionsJSON?: PublicKeyCredentialRequestOptionsJSON;
    useBrowserAutofill?: boolean;
  };
</script>

<script lang="ts">
  import { ChevronRightIcon, KeyRoundIcon, MailIcon } from '@lucide/svelte';
  import { browserSupportsWebAuthnAutofill, startAuthentication, WebAuthnAbortService } from '@simplewebauthn/browser';
  import { onMount } from 'svelte';
  import { superForm } from 'sveltekit-superforms';
  import { goto, pushState, replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import * as Empty from '$lib/components/ui/empty';
  import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
  import { Input } from '$lib/components/ui/input';
  import * as Item from '$lib/components/ui/item';
  import { Spinner } from '$lib/components/ui/spinner';
  import {
    generatePasskeyAuthenticationOptions,
    verifyPasskeyAuthentication,
  } from '$lib/passkey/authentication.remote.js';
  import type {
    AuthenticationResponseJSON,
    PublicKeyCredentialRequestOptionsJSON,
  } from '@simplewebauthn/browser';

  const { data } = $props();
  const { form, enhance, reset, submitting } = superForm(data.form, {
    resetForm: false,
    invalidateAll: false,
    onUpdate: ({ form, result }) => {
      if(result.type === 'success') {
        if (form.message?.preferredMethod === 'PASSKEY') {
          pushState('', { phase: 'PASSKEY' });
          startPasskeyAuthentication({ optionsJSON: form.message.optionsJSON });
        }
      }
    },
  });

  const startPasskeyAuthentication = async ({
    optionsJSON,
    useBrowserAutofill,
  }: StartPasskeyAuthenticationParams = {}) => {
    if(!optionsJSON) {
      optionsJSON = await generatePasskeyAuthenticationOptions({ email: $form.email || undefined });
    }

    return startAuthentication({ optionsJSON, useBrowserAutofill })
      .then(afterPasskeyAuthentication)
      .catch(() => {
        if (!useBrowserAutofill) {
          replaceState('', { phase: 'SELECT_METHOD' });
        }
      });
  };

  const afterPasskeyAuthentication = async (response: AuthenticationResponseJSON) => {
    const { success } = await verifyPasskeyAuthentication({ response });
    if (success) {
      goto(resolve('/(main)'));
    }
  };

  onMount(async () => {
    if (await browserSupportsWebAuthnAutofill()) {
      startPasskeyAuthentication({ useBrowserAutofill: true });
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-center text-2xl">
        {#if page.state.phase === 'SELECT_METHOD'}
          다른 방법으로 로그인
        {:else}
          별마루 통합 ID
        {/if}
      </CardTitle>
    </CardHeader>
    {#if page.state.phase === 'PASSKEY'}
      <CardContent>
        <h2 class="text-center text-lg font-medium">{$form.email}</h2>
        <Empty.Root>
          <Empty.Header>
            <Empty.Media>
              <Spinner class="size-10" />
            </Empty.Media>
            <Empty.Title>패스키로 로그인 중...</Empty.Title>
          </Empty.Header>
          <Empty.Content>
            <div class="flex flex-row gap-2">
              <Button onclick={() => { WebAuthnAbortService.cancelCeremony(); reset(); history.back(); }} variant="ghost">돌아가기</Button>
              <Button onclick={() => { WebAuthnAbortService.cancelCeremony(); replaceState('', { phase: 'SELECT_METHOD' }); }} variant="outline">다른 방법으로 로그인</Button>
            </div>
          </Empty.Content>
        </Empty.Root>
      </CardContent>
    {:else if page.state.phase === 'SELECT_METHOD'}
      <CardContent class="flex flex-col gap-2">
        <h2 class="text-center text-lg font-medium">{$form.email}</h2>
        <button class="w-full" onclick={() => { replaceState('', { phase: 'PASSKEY' }); startPasskeyAuthentication(); }}>
          <Item.Root variant="outline">
            <Item.Media>
              <KeyRoundIcon />
            </Item.Media>
            <Item.Content>
              <Item.Title>패스키로 로그인</Item.Title>
            </Item.Content>
            <Item.Actions>
              <ChevronRightIcon />
            </Item.Actions>
          </Item.Root>
        </button>
        {#if $form.email}
          <form method="post" use:enhance>
            <input name="email" type="hidden" value={$form.email} />
            <input name="forceEmailVerification" type="hidden" value="true" />
            <button class="w-full" type="submit">
              <Item.Root variant="outline">
                <Item.Media>
                  <MailIcon />
                </Item.Media>
                <Item.Content>
                  <Item.Title>이메일 인증으로 로그인</Item.Title>
                </Item.Content>
                <Item.Actions>
                  <ChevronRightIcon />
                </Item.Actions>
              </Item.Root>
            </button>
          </form>
        {/if}
      </CardContent>
      <CardFooter>
        <Button class="w-full" onclick={() => { reset(); history.back(); }} variant="ghost">돌아가기</Button>
      </CardFooter>
    {:else}
      <form class="flex flex-col gap-2" method="post" use:enhance>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel for="email">이메일</FieldLabel>
              <Input
                id="email"
                name="email"
                autocomplete="email webauthn"
                autofocus
                placeholder="이메일을 입력하세요"
                required
                type="email"
                bind:value={$form.email}
              />
            </Field>
            <Button class="w-full" aria-busy={$submitting} type="submit">시작하기</Button>
          </FieldGroup>
        </CardContent>
      </form>
    {/if}
  </Card>
</div>
