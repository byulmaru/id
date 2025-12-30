import { and, eq } from 'drizzle-orm';
import normalizeEmail from 'normalize-email';
import { db, first, firstOrThrow } from '../db';
import { Emails } from '../db/schema';

export const getEmail = async (emailAddress: string) => {
  const email = await db
    .select()
    .from(Emails)
    .where(and(eq(Emails.normalizedEmail, normalizeEmail(emailAddress)), eq(Emails.verified, true)))
    .then(first);

  if (email) {
    return email;
  }

  return await db
    .insert(Emails)
    .values({
      email: emailAddress,
      normalizedEmail: normalizeEmail(emailAddress),
      verified: false,
    })
    .returning()
    .then(firstOrThrow);
};
