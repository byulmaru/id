import { eq } from 'drizzle-orm';
import { db, first, OAuthSessions, Sessions } from './db';

export const getSession = async (session: string | undefined) => {
  if (!session) {
    return null;
  }

  return (await db.select().from(Sessions).where(eq(Sessions.token, session)).then(first)) ?? null;
};

export const getOAuthSession = async (session: string | null) => {
  if (!session) {
    return null;
  }

  return (
    (await db.select().from(OAuthSessions).where(eq(OAuthSessions.token, session)).then(first)) ??
    null
  );
};
