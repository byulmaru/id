import { configure, getConsoleSink } from '@logtape/logtape';
import { and, eq, isNull } from 'drizzle-orm';
import { env as publicEnv } from '$env/dynamic/public';
import { Accounts, db, Emails, first, Sessions } from '$lib/server/db';

export const init = async () => {
  await configure({
    sinks: { console: getConsoleSink() },
    loggers: [
      { category: ['drizzle-orm'], sinks: ['console'], lowestLevel: 'debug' },
      { category: ['server'], sinks: ['console'], lowestLevel: 'debug' },
    ],
  });
};

const gracefulShutdown = async () => {
  await db.$client.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export const handle = async ({ event, resolve }) => {
  let deviceId = event.cookies.get('deviceid');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    event.cookies.set('deviceid', deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      domain: publicEnv.PUBLIC_COOKIE_DOMAIN,
      path: '/',
    });
  }

  event.locals.deviceId = deviceId;

  const sessionToken = event.cookies.get('session');

  const account = sessionToken
    ? await db
        .select({
          id: Accounts.id,
          name: Accounts.name,
          primaryEmail: Emails.email,
          primaryEmailId: Accounts.primaryEmailId,
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
            primaryEmailId: account.primaryEmailId,
          },
        }
      : null;

  return resolve(event);
};

export const handleError = ({ error }) => {
  console.error(error);
};
