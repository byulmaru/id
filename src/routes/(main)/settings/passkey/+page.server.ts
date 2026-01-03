import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { AccountAuthenticators, db } from '$lib/server/db';

export const load = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/auth');
  }

  const passkeys = await db
    .select({
      id: AccountAuthenticators.id,
      kind: AccountAuthenticators.kind,
      name: AccountAuthenticators.name,
      credential: AccountAuthenticators.credential,
      createdAt: AccountAuthenticators.createdAt,
    })
    .from(AccountAuthenticators)
    .where(
      and(
        eq(AccountAuthenticators.accountId, locals.session.account.id),
        eq(AccountAuthenticators.kind, 'PASSKEY'),
      ),
    );

  return { passkeys };
};
