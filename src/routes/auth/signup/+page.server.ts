import { error, fail, redirect } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { and, eq, ne } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import {
  AccountEmails,
  AccountEmailVerifications,
  Accounts,
  first,
  firstOrThrow,
  getDatabase,
  Sessions,
} from '$lib/server/db';
import { OAuthAuthorizeSchema } from '../../oauth/authorize/schema';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하로 입력해주세요'),
  termsAgreed: z.boolean().refine((val) => val === true, '서비스 이용약관에 동의해주세요'),
  privacyAgreed: z.boolean().refine((val) => val === true, '개인정보 처리방침에 동의해주세요'),
});

export const load = async ({ cookies, platform }) => {
  const verificationId = cookies.get('signup_verification');

  if (!verificationId) {
    throw redirect(303, '/auth');
  }

  const db = await getDatabase(platform!.env.DATABASE_URL);

  const verification = await db
    .select({
      id: AccountEmailVerifications.id,
      accountEmail: {
        id: AccountEmails.id,
        email: AccountEmails.email,
        normalizedEmail: AccountEmails.normalizedEmail,
        accountId: AccountEmails.accountId,
      },
    })
    .from(AccountEmailVerifications)
    .innerJoin(AccountEmails, eq(AccountEmailVerifications.accountEmailId, AccountEmails.id))
    .where(eq(AccountEmailVerifications.id, verificationId))
    .then(first);

  if (!verification) {
    throw error(400, '유효하지 않은 접근입니다');
  }

  if (verification.accountEmail.accountId) {
    // 이미 계정이 있는 경우
    throw redirect(303, '/');
  }

  const form = await superValidate(zod(schema));

  return {
    email: verification.accountEmail.email,
    form,
  };
};

export const actions = {
  default: async ({ cookies, request, url, platform }) => {
    const form = await superValidate(request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const verificationId = cookies.get('signup_verification');
    if (!verificationId) {
      throw redirect(303, '/auth');
    }

    const db = await getDatabase(platform!.env.DATABASE_URL);

    const verification = await db
      .select({
        id: AccountEmailVerifications.id,
        accountEmail: {
          id: AccountEmails.id,
          normalizedEmail: AccountEmails.normalizedEmail,
          accountId: AccountEmails.accountId,
        },
      })
      .from(AccountEmailVerifications)
      .innerJoin(AccountEmails, eq(AccountEmailVerifications.accountEmailId, AccountEmails.id))
      .where(eq(AccountEmailVerifications.id, verificationId))
      .then(first);

    if (!verification) {
      throw error(400, '유효하지 않은 접근입니다');
    }

    if (verification.accountEmail.accountId) {
      throw redirect(303, '/');
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(AccountEmailVerifications)
        .where(eq(AccountEmailVerifications.id, verification.id));

      const accountId = await tx
        .insert(Accounts)
        .values({
          name: form.data.name,
          primaryEmailId: verification.accountEmail.id,
        })
        .returning({
          id: Accounts.id,
        })
        .then(firstOrThrow)
        .then(({ id }) => id);

      await tx
        .delete(AccountEmails)
        .where(
          and(
            eq(AccountEmails.normalizedEmail, verification.accountEmail.normalizedEmail),
            ne(AccountEmails.id, verification.accountEmail.id),
          ),
        );

      await tx
        .update(AccountEmails)
        .set({
          accountId,
        })
        .where(eq(AccountEmails.id, verification.accountEmail.id));

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
        domain: platform!.env.PUBLIC_COOKIE_DOMAIN,
        path: '/',
        expires: dayjs().add(1, 'year').toDate(),
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
