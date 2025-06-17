import { json } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  first,
  firstOrThrow,
  getDatabase,
  OAuthApplicationRedirectUris,
  OAuthApplications,
  OAuthApplicationSecrets,
  OAuthApplicationTokens,
  OAuthSessions,
} from '$lib/server/db';
import { uriToRedirectUrl } from '$lib/url';

const schema = z.object({
  grant_type: z.enum(['authorization_code']),
  code: z.string(),
  client_id: z.string(),
  client_secret: z.string(),
  redirect_uri: z.string().url().transform(uriToRedirectUrl),
});

export const POST = async ({ request, platform }) => {
  const { code, client_id, client_secret, redirect_uri } = schema.parse(await request.json());

  const db = await getDatabase(platform!.env.DATABASE_URL);

  const applicationToken = await db
    .delete(OAuthApplicationTokens)
    .where(eq(OAuthApplicationTokens.token, code))
    .returning({
      id: OAuthApplicationTokens.id,
      applicationId: OAuthApplicationTokens.applicationId,
      accountId: OAuthApplicationTokens.accountId,
      expiresAt: OAuthApplicationTokens.expiresAt,
    })
    .then(first);

  if (!applicationToken || dayjs(applicationToken.expiresAt).isBefore(dayjs())) {
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
      token: crypto.randomUUID(),
    })
    .returning({
      token: OAuthSessions.token,
    })
    .then(firstOrThrow);

  return json({
    access_token: session.token,
    token_type: 'Bearer',
  });
};
