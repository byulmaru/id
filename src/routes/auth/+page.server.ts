import { fail, redirect } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import normalizeEmail from 'normalize-email';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
  AccountAuthenticators,
  AccountEmails,
  AccountEmailVerifications,
  Accounts,
  first,
  firstOrThrow,
  getDatabase,
} from '$lib/server/db';
import { sendEmail } from '$lib/server/email';
import Login from '$lib/server/email/templates/Login';
import Signup from '$lib/server/email/templates/Signup';
import { schema } from './schema';

export const load = async () => {
  const form = await superValidate(zod(schema));

  return { form };
};

export const actions = {
  default: async ({ request, url, platform }) => {
    const form = await superValidate(request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const db = await getDatabase(platform!.env.DATABASE_URL!);

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

      const accountEmailId = account
        ? account.emailId
        : await db
            .insert(AccountEmails)
            .values({
              email,
              normalizedEmail,
            })
            .returning({ id: AccountEmails.id })
            .then((rows) => rows[0].id);

      const verification = await db
        .insert(AccountEmailVerifications)
        .values({
          accountEmailId,
          code: token,
          expiresAt: dayjs().add(10, 'minutes'),
        })
        .returning({
          id: AccountEmailVerifications.id,
          expiresAt: AccountEmailVerifications.expiresAt,
        })
        .onConflictDoUpdate({
          target: [AccountEmailVerifications.accountEmailId],
          set: {
            code: token,
            expiresAt: dayjs().add(10, 'minutes'),
          },
        })
        .then(firstOrThrow);

      const emailProps = {
        origin: url.origin,
        email,
        code: token,
        verificationId: verification.id,
        expiresAt: verification.expiresAt,
      };

      await sendEmail({
        subject: account ? '코스모 로그인하기' : '코스모 회원가입하기',
        recipient: email,
        body: account ? Login(emailProps) : Signup(emailProps),
      });

      throw redirect(303, `/auth/email?verificationId=${verification.id}`);
    } else {
      // TODO: 다른 로그인 방법 구현
    }
    return { form, foo: 'bar' };
  },
};
