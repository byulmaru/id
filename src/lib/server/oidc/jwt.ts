import { importJWK, SignJWT } from 'jose';
import { Temporal } from 'temporal-polyfill';
import { env } from '$env/dynamic/private';

export type IdTokenPayload = {
  sub: string;
  aud: string;
  iss: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  [key: string]: unknown;
};

export const jwk = JSON.parse(Buffer.from(env.OIDC_JWK, 'base64').toString() || '{}');

export const createIdToken = async (payload: IdTokenPayload) => {
  const now = Temporal.Now.instant();
  const privateKey = await importJWK(jwk, jwk.alg);

  return await new SignJWT({
    ...payload,
    iat: payload.iat ?? Math.floor(now.epochMilliseconds / 1000),
    exp: payload.exp ?? Math.floor(now.add({ minutes: 10 }).epochMilliseconds / 1000),
  })
    .setProtectedHeader({
      alg: jwk.alg!,
      kid: jwk.kid,
      typ: 'JWT',
    })
    .sign(privateKey);
};
