import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { createSession } from '$lib/server/auth/createSession';
import { Accounts, db, Emails, firstOrThrow, firstOrThrowWith } from '$lib/server/db';
import { validationSchema } from '$lib/validation';
import { OAuthAuthorizeSchema } from '../../oauth/authorize/schema';

const schema = z.object({
  name: validationSchema.name,
  termsAgreed: z.boolean().refine((val) => val === true, '서비스 이용약관에 동의해주세요'),
  privacyAgreed: z.boolean().refine((val) => val === true, '개인정보 처리방침에 동의해주세요'),
  emailId: z.string(),
});

export const load = async ({ cookies }) => {
  const emailId = cookies.get('signup_verification');

  if (!emailId) {
    throw redirect(303, '/auth');
  }

  const email = await db
    .select({
      id: Emails.id,
      accountId: Emails.accountId,
      email: Emails.email,
    })
    .from(Emails)
    .where(and(eq(Emails.id, emailId), eq(Emails.verified, true), isNull(Emails.accountId)))
    .then(firstOrThrowWith(() => redirect(303, '/auth')));

  const form = await superValidate(zod4(schema));

  return {
    email: {
      id: email.id,
      email: email.email,
    },
    form,
  };
};

export const actions = {
  default: async ({ cookies, request, url }) => {
    const form = await superValidate(request, zod4(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const email = await db
      .select({
        id: Emails.id,
        accountId: Emails.accountId,
        normalizedEmail: Emails.normalizedEmail,
      })
      .from(Emails)
      .where(
        and(eq(Emails.id, form.data.emailId), eq(Emails.verified, true), isNull(Emails.accountId)),
      )
      .then(firstOrThrowWith(() => redirect(303, '/auth')));

    await db.transaction(async (tx) => {
      const accountId = await tx
        .insert(Accounts)
        .values({
          name: form.data.name,
          primaryEmailId: email.id,
        })
        .returning({
          id: Accounts.id,
        })
        .then(firstOrThrow)
        .then(({ id }) => id);

      await tx
        .delete(Emails)
        .where(and(eq(Emails.normalizedEmail, email.normalizedEmail), ne(Emails.id, email.id)));

      await tx
        .update(Emails)
        .set({
          accountId,
        })
        .where(eq(Emails.id, email.id));

      await createSession({ accountId, cookies, tx });

      // 회원가입 완료로 쿠키 삭제
      cookies.delete('signup_verification', {
        path: '/',
      });
    });

    const oauthRedirectCookie = cookies.get('oauth_redirect_to');
    if (oauthRedirectCookie) {
      cookies.delete('oauth_redirect_to', {
        path: '/',
      });

      try {
        const oauthParams = OAuthAuthorizeSchema.parse(JSON.parse(oauthRedirectCookie));
        const oauthUrl = new URL('/oauth/authorize', url.origin);
        oauthUrl.searchParams.set('client_id', oauthParams.client_id);
        oauthUrl.searchParams.set('redirect_uri', oauthParams.redirect_uri.toString());
        oauthUrl.searchParams.set('response_type', oauthParams.response_type);
        if (oauthParams.state) {
          oauthUrl.searchParams.set('state', oauthParams.state);
        }

        return redirect(303, oauthUrl.toString());
      } catch {
        return redirect(303, '/');
      }
    }

    return redirect(303, '/');
  },
};
