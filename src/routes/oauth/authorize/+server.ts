import { error, redirect } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  db,
  firstOrThrow,
  firstOrThrowWith,
  OAuthApplicationRedirectUris,
  OAuthApplications,
  OAuthApplicationTokens,
} from '$lib/server/db';
import { getSession } from '$lib/server/session';
import { OAuthAuthorizeSchema } from './schema';

export const GET = async ({ cookies, url }) => {
  const { client_id, redirect_uri, state } = OAuthAuthorizeSchema.parse(
    Object.fromEntries(url.searchParams),
  );

  const application = await db
    .select({
      id: OAuthApplications.id,
      redirectUriId: OAuthApplicationRedirectUris.id,
    })
    .from(OAuthApplications)
    .leftJoin(
      OAuthApplicationRedirectUris,
      and(
        eq(OAuthApplications.id, OAuthApplicationRedirectUris.applicationId),
        eq(OAuthApplicationRedirectUris.redirectUri, redirect_uri.toString()),
      ),
    )
    .where(eq(OAuthApplications.id, client_id))
    .then(firstOrThrowWith(() => error(404, { message: 'app_not_found' })));

  if (!application.redirectUriId) {
    throw error(400, { message: 'invalid_redirect_uri' });
  }

  const session = await getSession(cookies.get('session'));
  if (session) {
    return redirect(
      303,
      await db.transaction(async (tx) => {
        const token = await tx
          .insert(OAuthApplicationTokens)
          .values({
            accountId: session.accountId,
            applicationId: application.id,
            redirectUriId: application.redirectUriId!,
            token: crypto.randomUUID(),
            expiresAt: dayjs().add(5, 'minutes'),
          })
          .returning({
            token: OAuthApplicationTokens.token,
          })
          .then(firstOrThrow);

        redirect_uri.searchParams.set('code', token.token);
        if (state) {
          redirect_uri.searchParams.set('state', state);
        }

        return redirect_uri.toString();
      }),
    );
  } else {
    cookies.set(
      'oauth_redirect_to',
      JSON.stringify({
        client_id,
        redirect_uri: redirect_uri.toString(),
        response_type: 'code',
        state,
      } satisfies z.input<typeof OAuthAuthorizeSchema>),
      {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      },
    );

    return redirect(303, '/auth');
  }
};
