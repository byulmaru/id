import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { Accounts, db } from '$lib/server/db';
import { validationSchema } from '$lib/validation.js';

const schema = z.object({
  name: validationSchema.name,
});

export const load = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/auth');
  }

  const form = await superValidate({ name: locals.session.account.name }, zod4(schema));

  return {
    form,
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await superValidate(request, zod4(schema));

    if (!locals.session) {
      throw redirect(303, '/auth');
    }

    if (!form.valid) {
      return fail(400, { form });
    }

    await db
      .update(Accounts)
      .set({ name: form.data.name })
      .where(eq(Accounts.id, locals.session.account.id));

    return { form };
  },
};
