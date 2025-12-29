import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import normalizeEmail from 'normalize-email';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import {
  AccountAuthenticators,
  Accounts,
  db,
  Emails,
  EmailVerifications,
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
        emailId: Emails.id,
      })
      .from(Accounts)
      .innerJoin(Emails, eq(Accounts.primaryEmailId, Emails.id))
      .where(eq(Emails.normalizedEmail, normalizedEmail))
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
      // 인증 방법이 없는 경우 - 이메일 인증 (로그인/회원가입)

      const isSignUp = !account;

      const token = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');

      const verification = await db.transaction(async (tx) => {
        const emailId = account
          ? account.emailId
          : await tx
              .insert(Emails)
              .values({
                email,
                normalizedEmail,
              })
              .returning({ id: Emails.id })
              .then((rows) => rows[0].id);

        const verification = await tx
          .insert(EmailVerifications)
          .values({
            emailId,
            purpose: isSignUp ? 'SIGN_UP' : 'LOGIN',
            code: token,
            expiresAt: Temporal.Now.instant().add({ minutes: 10 }),
          })
          .returning({
            id: EmailVerifications.id,
            expiresAt: EmailVerifications.expiresAt,
          })
          .onConflictDoUpdate({
            target: [EmailVerifications.emailId],
            set: {
              purpose: isSignUp ? 'SIGN_UP' : 'LOGIN',
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
          subject: isSignUp ? '별마루 통합 계정 가입하기' : '별마루 통합 계정 로그인하기',
          recipient: email,
          body: isSignUp ? Signup(emailProps) : Login(emailProps),
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
