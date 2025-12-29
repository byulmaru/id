import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { env as publicEnv } from '$env/dynamic/public';
import { db, Emails, EmailVerifications, first, firstOrThrow, Sessions } from '$lib/server/db';
import { OAuthAuthorizeSchema } from '../../oauth/authorize/schema';

const schema = z.object({
  verificationId: z.string(),
  code: z.string().regex(/^\d{6}$/, '코드 형식이 맞지 않아요'),
});

export const load = async ({ url }) => {
  const verificationId = url.searchParams.get('verificationId');

  if (!verificationId) {
    throw error(400, 'Verification ID is required');
  }

  const verification = await db
    .select({
      id: EmailVerifications.id,
      email: Emails.email,
    })
    .from(EmailVerifications)
    .where(eq(EmailVerifications.id, verificationId))
    .innerJoin(Emails, eq(EmailVerifications.emailId, Emails.id))
    .then(firstOrThrow);

  const form = await superValidate(
    { verificationId: verification.id, code: url.searchParams.get('code') ?? '' },
    zod4(schema),
  );

  return {
    email: verification.email,
    form,
  };
};

export const actions = {
  default: async ({ cookies, request, url }) => {
    const form = await superValidate(request, zod4(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const verification = await db
      .select({
        id: EmailVerifications.id,
        expiresAt: EmailVerifications.expiresAt,
        purpose: EmailVerifications.purpose,
        email: {
          id: Emails.id,
          accountId: Emails.accountId,
        },
      })
      .from(EmailVerifications)
      .innerJoin(Emails, eq(EmailVerifications.emailId, Emails.id))
      .where(
        and(
          eq(EmailVerifications.id, form.data.verificationId),
          eq(EmailVerifications.code, form.data.code),
        ),
      )
      .then(first);

    if (!verification) {
      return setError(form, 'code', '코드가 일치하지 않아요');
    }

    if (Temporal.Instant.compare(verification.expiresAt, Temporal.Now.instant()) < 0) {
      return setError(form, 'code', '코드가 만료되었어요. 다시 시도해 주세요.');
    }

    if (verification.purpose === 'SIGN_UP') {
      // 신규 가입자 - verification을 삭제하지 않고 회원가입 페이지로 리다이렉트
      await db.transaction(async (tx) => {
        await tx.delete(EmailVerifications).where(eq(EmailVerifications.id, verification.id));

        const signupVerification = await tx
          .insert(EmailVerifications)
          .values({
            emailId: verification.email.id,
            purpose: 'SIGN_UP_VERIFIED',
            expiresAt: Temporal.Now.instant().add({ hours: 24 }),
          })
          .returning({
            id: EmailVerifications.id,
          })
          .then(firstOrThrow);

        cookies.set('signup_verification', signupVerification.id, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        });
      });

      return redirect(303, '/auth/signup');
    } else if (verification.purpose === 'LOGIN') {
      // 기존 사용자 - verification 삭제하고 로그인 처리
      await db.transaction(async (tx) => {
        await tx.delete(EmailVerifications).where(eq(EmailVerifications.id, verification.id));

        const accountId = verification.email.accountId!;

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
      });
    }

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
