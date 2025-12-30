import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env as publicEnv } from '$env/dynamic/public';
import { db, Sessions } from '$lib/server/db';

export const actions = {
  logout: async ({ locals, cookies }) => {
    if (locals.session) {
      await db.transaction(async (tx) => {
        await tx.delete(Sessions).where(eq(Sessions.token, locals.session!.token));
      });

      cookies.delete('session', {
        path: '/',
        domain: publicEnv.PUBLIC_COOKIE_DOMAIN,
      });
    }

    throw redirect(303, '/auth');
  },
};
