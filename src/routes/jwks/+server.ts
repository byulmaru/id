import { json } from '@sveltejs/kit';
import { publicJwk } from '$lib/server/oidc/jwt';

export const GET = async () => {
  return json({
    keys: [publicJwk],
  });
};
