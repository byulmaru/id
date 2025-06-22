import { json } from '@sveltejs/kit';
import { getJwk } from '$lib/server/oidc/jwt';

export const GET = async () => {
  const jwk = getJwk();

  return json({
    keys: [{ kid: jwk.kid, kty: jwk.kty, alg: jwk.alg, crv: jwk.crv, x: jwk.x }],
  });
};
