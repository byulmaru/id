import { env as publicEnv } from '$env/dynamic/public';
import { db, firstOrThrow, Sessions } from '../db';
import type { Cookies } from '@sveltejs/kit';
import type { Transaction } from '../db';

type CreateSessionParams = {
  accountId: string;
  cookies?: Cookies;
  tx?: Transaction;
};

export const createSession = async ({ accountId, cookies, ...params }: CreateSessionParams) => {
  const tx = params.tx ?? db;

  const session = await tx
    .insert(Sessions)
    .values({
      accountId,
      token: crypto.randomUUID(),
    })
    .returning()
    .then(firstOrThrow);

  cookies?.set('session', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    domain: publicEnv.PUBLIC_COOKIE_DOMAIN,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return session;
};
