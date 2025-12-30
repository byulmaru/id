import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { getEmail } from '$lib/server/auth/getEmail.js';
import { sendEmailVerification } from '$lib/server/auth/sendEmailVerification';
import { AccountAuthenticators, db } from '$lib/server/db';

const schema = z.object({
  email: z.email(),
});

export const load = async () => {
  const form = await superValidate(zod4(schema));

  return { form };
};

export const actions = {
  default: async ({ request, url }) => {
    const form = await superValidate(request, zod4(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const email = await getEmail(form.data.email);

    const accountAuthenticators = email.accountId
      ? await db
          .select({
            kind: AccountAuthenticators.kind,
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
      // TODO: 다른 로그인 방법 구현
    }
    return { form };
  },
};
