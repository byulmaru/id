import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, gt, ne } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { env as publicEnv } from '$env/dynamic/public';
import {
  Accounts,
  db,
  Emails,
  EmailVerifications,
  first,
  firstOrThrow,
  Sessions,
} from '$lib/server/db';
import { validationSchema } from '$lib/validation';
import { OAuthAuthorizeSchema } from '../../oauth/authorize/schema';

const schema = z.object({
  name: validationSchema.name,
  termsAgreed: z.boolean().refine((val) => val === true, '서비스 이용약관에 동의해주세요'),
  privacyAgreed: z.boolean().refine((val) => val === true, '개인정보 처리방침에 동의해주세요'),
});

export const load = async ({ cookies }) => {
  const verificationId = cookies.get('signup_verification');

  if (!verificationId) {
    throw redirect(303, '/auth');
  }

  const verification = await db
    .select({
      id: EmailVerifications.id,
      email: {
        id: Emails.id,
        email: Emails.email,
        normalizedEmail: Emails.normalizedEmail,
        accountId: Emails.accountId,
      },
    })
    .from(EmailVerifications)
    .innerJoin(Emails, eq(EmailVerifications.emailId, Emails.id))
    .where(
      and(
        eq(EmailVerifications.id, verificationId),
        eq(EmailVerifications.purpose, 'SIGN_UP_VERIFIED'),
        gt(EmailVerifications.expiresAt, Temporal.Now.instant()),
      ),
    )
    .then(first);

  if (!verification) {
    throw redirect(303, '/auth');
  }

  if (verification.email.accountId) {
    // 이미 계정이 있는 경우
    throw redirect(303, '/');
  }

  const form = await superValidate(zod4(schema));

  return {
    email: verification.email.email,
    form,
  };
};

export const actions = {
  default: async ({ cookies, request, url }) => {
    const form = await superValidate(request, zod4(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const verificationId = cookies.get('signup_verification');
    if (!verificationId) {
      throw error(400, '유효하지 않은 접근입니다');
    }

    const verification = await db
      .select({
        id: EmailVerifications.id,
        email: {
          id: Emails.id,
          normalizedEmail: Emails.normalizedEmail,
          accountId: Emails.accountId,
        },
      })
      .from(EmailVerifications)
      .innerJoin(Emails, eq(EmailVerifications.emailId, Emails.id))
      .where(
        and(
          eq(EmailVerifications.id, verificationId),
          eq(EmailVerifications.purpose, 'SIGN_UP_VERIFIED'),
          gt(EmailVerifications.expiresAt, Temporal.Now.instant()),
        ),
      )
      .then(first);

    if (!verification) {
      throw error(400, '유효하지 않은 접근입니다');
    }

    if (verification.email.accountId) {
      throw redirect(303, '/');
    }

    await db.transaction(async (tx) => {
      await tx.delete(EmailVerifications).where(eq(EmailVerifications.id, verification.id));

      const accountId = await tx
        .insert(Accounts)
        .values({
          name: form.data.name,
          primaryEmailId: verification.email.id,
        })
        .returning({
          id: Accounts.id,
        })
        .then(firstOrThrow)
        .then(({ id }) => id);

      await tx
        .delete(Emails)
        .where(
          and(
            eq(Emails.normalizedEmail, verification.email.normalizedEmail),
            ne(Emails.id, verification.email.id),
          ),
        );

      await tx
        .update(Emails)
        .set({
          accountId,
        })
        .where(eq(Emails.id, verification.email.id));

      const session = await tx
        .insert(Sessions)
        .values({
          accountId,
          token: crypto.randomUUID(),
        })
        .returning({
          token: Sessions.token,
        })
        .then(firstOrThrow);

      cookies.set('session', session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: publicEnv.PUBLIC_COOKIE_DOMAIN,
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });

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
