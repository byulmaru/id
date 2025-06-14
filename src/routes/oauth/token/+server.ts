import { json } from '@sveltejs/kit';
import dayjs from 'dayjs';
import { and, eq, lt } from 'drizzle-orm';
import { z } from 'zod';
import {
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
  const { code, client_id, client_secret, redirect_uri } = schema.parse(
    Object.fromEntries(await request.formData()),
  );

  const db = await getDatabase(platform!.env.DATABASE_URL);

  const applicationToken = await db
    .select({
      applicationId: OAuthApplicationTokens.applicationId,
      accountId: OAuthApplicationTokens.accountId,
    })
    .from(OAuthApplicationTokens)
    .innerJoin(
      OAuthApplicationSecrets,
      and(
        eq(OAuthApplicationTokens.applicationId, OAuthApplicationSecrets.applicationId),
        eq(OAuthApplicationSecrets.secret, client_secret),
      ),
    )
    .innerJoin(OAuthApplications, eq(OAuthApplicationTokens.applicationId, OAuthApplications.id))
    .innerJoin(
      OAuthApplicationRedirectUris,
      eq(OAuthApplicationTokens.redirectUriId, OAuthApplicationRedirectUris.id),
    )
    .where(
      and(
        eq(OAuthApplicationTokens.token, code),
        eq(OAuthApplications.id, client_id),
        eq(OAuthApplicationRedirectUris.redirectUri, redirect_uri.toString()),
        lt(OAuthApplicationTokens.expiresAt, dayjs()),
      ),
    )
    .then(firstOrThrow);

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
