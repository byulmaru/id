import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  first,
  getDatabase,
  OAuthApplications,
  OAuthApplicationSecrets,
  OAuthSessions,
} from '$lib/server/db';

const schema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  token: z.string(),
});

export const POST = async ({ request, platform }) => {
  const { client_id, client_secret, token } = schema.parse(await request.json());

  const db = await getDatabase(platform!.env.DATABASE_URL);

  const application = await db
    .select({
      id: OAuthApplications.id,
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

  if (!application) {
    return json({ error: 'invalid_client' }, { status: 401 });
  }

  const session = await db
    .select({
      id: OAuthSessions.id,
      applicationId: OAuthSessions.applicationId,
    })
    .from(OAuthSessions)
    .where(eq(OAuthSessions.token, token))
    .then(first);

  if (session) {
    if (session.applicationId !== application.id) {
      return json({ error: 'invalid_grant' }, { status: 400 });
    }

    await db.delete(OAuthSessions).where(eq(OAuthSessions.id, session.id));
  }

  return json({});
};
