import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import normalizeEmail from 'normalize-email';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import {
  AccountAuthenticators,
  AccountEmails,
  AccountEmailVerifications,
  Accounts,
  db,
  first,
  firstOrThrow,
} from '$lib/server/db';
import { sendEmail } from '$lib/server/email';
import Login from '$lib/server/email/templates/Login';
import Signup from '$lib/server/email/templates/Signup';

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

    const email = form.data.email;
    const normalizedEmail = normalizeEmail(email);

    const account = await db
      .select({
        id: Accounts.id,
        emailId: AccountEmails.id,
      })
      .from(Accounts)
      .innerJoin(AccountEmails, eq(Accounts.primaryEmailId, AccountEmails.id))
      .where(eq(AccountEmails.normalizedEmail, normalizedEmail))
      .then(first);

    const accountAuthenticators = account
      ? await db
          .select({
            kind: AccountAuthenticators.kind,
          })
          .from(AccountAuthenticators)
          .where(eq(AccountAuthenticators.accountId, account.id))
      : [];

    if (accountAuthenticators.length === 0) {
      const token = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');

      const verification = await db.transaction(async (tx) => {
        const accountEmailId = account
          ? account.emailId
          : await tx
              .insert(AccountEmails)
              .values({
                email,
                normalizedEmail,
              })
              .returning({ id: AccountEmails.id })
              .then((rows) => rows[0].id);

        const verification = await tx
          .insert(AccountEmailVerifications)
          .values({
            accountEmailId,
            code: token,
            expiresAt: Temporal.Now.instant().add({ minutes: 10 }),
          })
          .returning({
            id: AccountEmailVerifications.id,
            expiresAt: AccountEmailVerifications.expiresAt,
          })
          .onConflictDoUpdate({
            target: [AccountEmailVerifications.accountEmailId],
            set: {
              code: token,
              expiresAt: Temporal.Now.instant().add({ minutes: 10 }),
            },
          })
          .then(firstOrThrow);

        console.log(verification);

        const emailProps = {
          origin: url.origin,
          email,
          code: token,
          verificationId: verification.id,
          expiresAt: verification.expiresAt,
        };

        await sendEmail({
          subject: account ? '별마루 통합 계정 로그인하기' : '별마루 통합 계정 가입하기',
          recipient: email,
          body: account ? Login(emailProps) : Signup(emailProps),
        });

        return verification;
      });

      throw redirect(303, `/auth/email?verificationId=${verification.id}`);
    } else {
      // TODO: 다른 로그인 방법 구현
    }
    return { form };
  },
};
