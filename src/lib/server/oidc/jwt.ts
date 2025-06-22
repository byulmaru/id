import dayjs from 'dayjs';
import { importJWK, SignJWT } from 'jose';
import { env } from '$env/dynamic/private';
import type { JWK } from 'jose';

export type IdTokenPayload = {
  sub: string;
  aud: string;
  iss: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  [key: string]: unknown;
};

export const jwk = JSON.parse(Buffer.from(env.OIDC_JWK, 'base64').toString()) as JWK;
export const publicJwk = { kid: jwk.kid, kty: jwk.kty, alg: jwk.alg, crv: jwk.crv, x: jwk.x };

export const privateKey = await importJWK(jwk, jwk.alg);
export const publicKey = await importJWK(publicJwk, jwk.alg);

export const createIdToken = async (payload: IdTokenPayload) => {
  const now = dayjs();

  return await new SignJWT({
    ...payload,
    iat: payload.iat ?? now.unix(),
    exp: payload.exp ?? now.add(10, 'minutes').unix(),
  })
    .setProtectedHeader({
      alg: publicJwk.alg!,
      kid: publicJwk.kid,
      typ: 'JWT',
    })
    .sign(privateKey);
};
