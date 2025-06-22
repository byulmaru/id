import { error, redirect } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  firstOrThrow,
  firstOrThrowWith,
  getDatabase,
  OAuthApplicationRedirectUris,
  OAuthApplications,
  OAuthApplicationTokens,
} from '$lib/server/db';
import { filterSupportedScopes, parseScopes, validateScopes } from '$lib/server/oidc/scopes';
import { getSession } from '$lib/server/session';
import { OAuthAuthorizeSchema } from './schema';

export const GET = async ({ cookies, url, platform }) => {
  const { client_id, redirect_uri, state, scope } = OAuthAuthorizeSchema.parse(
    Object.fromEntries(url.searchParams),
  );

  const requestedScopes = parseScopes(scope);

  const db = await getDatabase(platform!.env.DATABASE_URL);

  const application = await db
    .select({
      id: OAuthApplications.id,
      redirectUriId: OAuthApplicationRedirectUris.id,
      scopes: OAuthApplications.scopes,
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

  const scopes = filterSupportedScopes(requestedScopes);
  if (!validateScopes(scopes, application.scopes)) {
    throw error(400, { message: 'invalid_scope' });
  }

  const session = await getSession(db, cookies.get('session'));
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
            scopes,
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
        scope,
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
