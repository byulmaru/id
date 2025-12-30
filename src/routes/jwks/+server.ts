import { json } from '@sveltejs/kit';
import { jwk } from '$lib/server/oidc/jwt';

export const GET = async () => {
  return json({
    keys: [{ kid: jwk.kid, kty: jwk.kty, alg: jwk.alg, crv: jwk.crv, x: jwk.x }],
  });
};
