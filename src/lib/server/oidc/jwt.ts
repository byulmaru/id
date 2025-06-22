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

export const getJwk = (): JWK => JSON.parse(Buffer.from(env.OIDC_JWK, 'base64').toString());

export const createIdToken = async (payload: IdTokenPayload) => {
  const now = dayjs();
  const jwk = getJwk();
  const privateKey = await importJWK(jwk, jwk.alg);

  return await new SignJWT({
    ...payload,
    iat: payload.iat ?? now.unix(),
    exp: payload.exp ?? now.add(10, 'minutes').unix(),
  })
    .setProtectedHeader({
      alg: jwk.alg!,
      kid: jwk.kid,
      typ: 'JWT',
    })
    .sign(privateKey);
};
