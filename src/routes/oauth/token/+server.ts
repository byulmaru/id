import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { env as publicEnv } from '$env/dynamic/public';
import {
  AccountEmails,
  Accounts,
  db,
  first,
  firstOrThrow,
  OAuthApplicationRedirectUris,
  OAuthApplications,
  OAuthApplicationSecrets,
  OAuthApplicationTokens,
  OAuthSessions,
} from '$lib/server/db';
import { createIdToken } from '$lib/server/oidc/jwt';
import { isOIDCRequest } from '$lib/server/oidc/scopes';
import { uriToRedirectUrl } from '$lib/url';

const schema = z.object({
  grant_type: z.enum(['authorization_code']),
  code: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  redirect_uri: z.string().url().transform(uriToRedirectUrl),
});

export const POST = async ({ request }) => {
  const { code, client_id, client_secret, redirect_uri } = schema.parse(await request.json());

  const applicationToken = await db
    .delete(OAuthApplicationTokens)
    .where(eq(OAuthApplicationTokens.token, code))
    .returning({
      id: OAuthApplicationTokens.id,
      applicationId: OAuthApplicationTokens.applicationId,
      accountId: OAuthApplicationTokens.accountId,
      scopes: OAuthApplicationTokens.scopes,
      nonce: OAuthApplicationTokens.nonce,
      expiresAt: OAuthApplicationTokens.expiresAt,
    })
    .then(first);

  if (
    !applicationToken ||
    Temporal.Instant.compare(applicationToken.expiresAt, Temporal.Now.instant()) < 0
  ) {
    return json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  const application = await db
    .select({
      id: OAuthApplications.id,
      secret: OAuthApplicationSecrets.secret,
    })
    .from(OAuthApplications)
    .innerJoin(
      OAuthApplicationSecrets,
      and(
        eq(OAuthApplications.id, OAuthApplicationSecrets.applicationId),
        eq(OAuthApplicationSecrets.secret, client_secret),
      ),
    )
    .where(eq(OAuthApplications.id, client_id))
    .then(first);

  if (!application || application.id !== applicationToken.applicationId) {
    return json({ error: 'Invalid client' }, { status: 400 });
  }

  const redirectUri = await db
    .select({
      id: OAuthApplicationRedirectUris.id,
    })
    .from(OAuthApplicationRedirectUris)
    .where(
      and(
        eq(OAuthApplicationRedirectUris.applicationId, applicationToken.applicationId),
        eq(OAuthApplicationRedirectUris.redirectUri, redirect_uri.toString()),
      ),
    )
    .then(first);

  if (!redirectUri) {
    return json({ error: 'Invalid redirect_uri' }, { status: 400 });
  }

  const session = await db
    .insert(OAuthSessions)
    .values({
      applicationId: applicationToken.applicationId,
      accountId: applicationToken.accountId,
      scopes: applicationToken.scopes,
      token: crypto.randomUUID(),
    })
    .returning({
      token: OAuthSessions.token,
    })
    .then(firstOrThrow);

  let idToken: string | undefined;

  if (isOIDCRequest(applicationToken.scopes)) {
    const account = await db
      .select({
        id: Accounts.id,
        name: Accounts.name,
        email: AccountEmails.email,
      })
      .from(Accounts)
      .innerJoin(AccountEmails, eq(Accounts.primaryEmailId, AccountEmails.id))
      .where(eq(Accounts.id, applicationToken.accountId))
      .then(firstOrThrow);

    idToken = await createIdToken({
      sub: account.id,
      aud: client_id,
      iss: publicEnv.PUBLIC_OIDC_ISSUER,
      nonce: applicationToken.nonce || undefined,
      ...(applicationToken.scopes.includes('profile') && { name: account.name }),
      ...(applicationToken.scopes.includes('email') && { email: account.email }),
    });
  }

  return json({
    access_token: session.token,
    token_type: 'Bearer',
    id_token: idToken,
  });
};
