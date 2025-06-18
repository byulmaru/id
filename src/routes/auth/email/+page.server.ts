import { error, fail, redirect } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { and, eq } from 'drizzle-orm';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import {
  AccountEmails,
  AccountEmailVerifications,
  first,
  firstOrThrow,
  getDatabase,
  Sessions,
} from '$lib/server/db';
import { OAuthAuthorizeSchema } from '../../oauth/authorize/schema';
import { env } from '$env/dynamic/private';

const schema = z.object({
  verificationId: z.string(),
  code: z.string().regex(/^\d{6}$/, '코드 형식이 맞지 않아요'),
});

export const load = async ({ url, platform }) => {
  const verificationId = url.searchParams.get('verificationId');

  if (!verificationId) {
    throw error(400, 'Verification ID is required');
  }

  const db = await getDatabase(platform!.env.DATABASE_URL);

  const verification = await db
    .select({
      id: AccountEmailVerifications.id,
      email: AccountEmails.email,
    })
    .from(AccountEmailVerifications)
    .where(eq(AccountEmailVerifications.id, verificationId))
    .innerJoin(AccountEmails, eq(AccountEmailVerifications.accountEmailId, AccountEmails.id))
    .then(firstOrThrow);

  const form = await superValidate(
    { verificationId: verification.id, code: url.searchParams.get('code') ?? '' },
    zod(schema),
  );

  return {
    email: verification.email,
    form,
  };
};

export const actions = {
  default: async ({ cookies, request, url, platform }) => {
    const form = await superValidate(request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const db = await getDatabase(platform!.env.DATABASE_URL);

    const verification = await db
      .select({
        id: AccountEmailVerifications.id,
        expiresAt: AccountEmailVerifications.expiresAt,
        accountEmail: {
          id: AccountEmails.id,
          normalizedEmail: AccountEmails.normalizedEmail,
          accountId: AccountEmails.accountId,
        },
      })
      .from(AccountEmailVerifications)
      .innerJoin(AccountEmails, eq(AccountEmailVerifications.accountEmailId, AccountEmails.id))
      .where(
        and(
          eq(AccountEmailVerifications.id, form.data.verificationId),
          eq(AccountEmailVerifications.code, form.data.code),
        ),
      )
      .then(first);

    if (!verification) {
      return setError(form, 'code', '코드가 일치하지 않아요');
    }

    if (verification.expiresAt.isBefore(dayjs())) {
      return setError(form, 'code', '코드가 만료되었어요. 다시 시도해 주세요.');
    }

    if (!verification.accountEmail.accountId) {
      // 신규 가입자 - verification을 삭제하지 않고 회원가입 페이지로 리다이렉트
      cookies.set('signup_verification', verification.id, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });

      return redirect(303, '/auth/signup');
    }

    // 기존 사용자 - verification 삭제하고 로그인 처리
    await db.transaction(async (tx) => {
      await tx
        .delete(AccountEmailVerifications)
        .where(eq(AccountEmailVerifications.id, verification.id));

      const accountId = verification.accountEmail.accountId!;

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
        path: env.COOKIE_PATH,
        expires: dayjs().add(1, 'year').toDate(),
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
