import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { firstOrThrow, getDatabase } from '$lib/server/db';
import { AccountEmails, Accounts } from '$lib/server/db/schema';
import { getOAuthSession } from '$lib/server/session';

export const GET = async ({ request, platform }) => {
  const db = await getDatabase(platform!.env.DATABASE_URL);

  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.*)$/)?.[1] ?? null;
  const session = await getOAuthSession(db, token);
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db
    .select({
      id: Accounts.id,
      name: Accounts.name,
      email: AccountEmails.email,
    })
    .from(Accounts)
    .innerJoin(AccountEmails, eq(Accounts.primaryEmailId, AccountEmails.id))
    .where(eq(Accounts.id, session.accountId))
    .then(firstOrThrow);

  return json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
};
