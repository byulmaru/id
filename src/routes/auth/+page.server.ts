import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { generatePasskeyAuthenticationOptions } from '$lib/passkey/authentication.remote';
import { getEmail } from '$lib/server/auth/getEmail.js';
import { sendEmailVerification } from '$lib/server/auth/sendEmailVerification';
import { AccountAuthenticatorKind, AccountAuthenticators, db } from '$lib/server/db';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/server';
import type { Infer } from 'sveltekit-superforms';
import type { PasskeyAccountAuthenticatorCredential } from '$lib/passkey/types';

type AuthenticatorKind = (typeof AccountAuthenticatorKind.enumValues)[number];

type Message = {
  preferredMethod: 'PASSKEY';
  optionsJSON: PublicKeyCredentialRequestOptionsJSON;
};

const schema = z.object({
  email: z.email(),
  forceEmailVerification: z.boolean().default(false),
});

export const load = async () => {
  const form = await superValidate<Infer<typeof schema>, Message>(zod4(schema));

  return { form };
};

export const actions = {
  default: async ({ request, url }) => {
    const form = await superValidate(request, zod4(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const email = await getEmail(form.data.email);

    const accountAuthenticators = email.accountId && !form.data.forceEmailVerification
      ? await db
          .select({
            kind: AccountAuthenticators.kind,
            key: AccountAuthenticators.key,
            credential: AccountAuthenticators.credential,
          })
          .from(AccountAuthenticators)
          .where(eq(AccountAuthenticators.accountId, email.accountId))
      : [];

    if (accountAuthenticators.length === 0) {
      const verification = await sendEmailVerification(
        email,
        email.accountId ? 'LOGIN' : 'SIGN_UP',
        url.origin,
      );

      throw redirect(303, `/auth/email?verificationId=${verification.id}`);
    } else {
      const availableMethods = accountAuthenticators.reduce((acc, authenticator) => {
        acc.add(authenticator.kind);
        return acc;
      }, new Set<AuthenticatorKind>());

      if (availableMethods.has('PASSKEY')) {
        const optionsJSON = await generatePasskeyAuthenticationOptions({
          allowCredentials: accountAuthenticators.filter(
            (
              authenticator,
            ): authenticator is {
              kind: 'PASSKEY';
              key: string;
              credential: PasskeyAccountAuthenticatorCredential;
            } => authenticator.kind === 'PASSKEY' && !!authenticator.key,
          ),
        });

        return message(form, { preferredMethod: 'PASSKEY', optionsJSON });
      }
    }

    throw new Error('Should not reach here');
  },
};
