import { eq } from 'drizzle-orm';
import { first, OAuthSessions, Sessions } from './db';
import type { Database } from './db';

export const getSession = async (db: Database, session: string | undefined) => {
  if (!session) {
    return null;
  }

  return (await db.select().from(Sessions).where(eq(Sessions.token, session)).then(first)) ?? null;
};

export const getOAuthSession = async (db: Database, session: string | null) => {
  if (!session) {
    return null;
  }

  return (
    (await db.select().from(OAuthSessions).where(eq(OAuthSessions.token, session)).then(first)) ??
    null
  );
};
