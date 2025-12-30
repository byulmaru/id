import { and, eq, isNull } from 'drizzle-orm';
import { Accounts, db, Emails, first, Sessions } from '$lib/server/db';

const gracefulShutdown = async () => {
  await db.$client.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export const handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session');

  const account = sessionToken
    ? await db
        .select({
          id: Accounts.id,
          name: Accounts.name,
          primaryEmail: Emails.email,
        })
        .from(Accounts)
        .innerJoin(Emails, eq(Accounts.primaryEmailId, Emails.id))
        .innerJoin(Sessions, eq(Sessions.accountId, Accounts.id))
        .where(and(eq(Sessions.token, sessionToken), isNull(Sessions.applicationId)))
        .then(first)
    : null;

  event.locals.session =
    sessionToken && account
      ? {
          token: sessionToken,
          account: {
            id: account.id,
            name: account.name,
            primaryEmail: account.primaryEmail,
          },
        }
      : null;

  return resolve(event);
};
