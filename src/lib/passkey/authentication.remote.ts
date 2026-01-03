import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { error } from '@sveltejs/kit';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { command, getRequestEvent, query } from '$app/server';
import { env as publicEnv } from '$env/dynamic/public';
import { createSession } from '$lib/server/auth/createSession';
import { AccountAuthenticators, db, Emails, first } from '$lib/server/db';
import { getChallenge, saveChallenge } from './challenge.server';
import { filterPasskeyCredentialsAndParse, passkeyAccountAuthenticatorCredentialSchema } from './types';

const allowCredentialsSchema = z
  .object({
    key: z.string(),
    credential: passkeyAccountAuthenticatorCredentialSchema,
  })
  .pipe(
    z.transform((data) => ({
      id: data.key,
      transports: data.credential.transports,
    })),
  );

export const generatePasskeyAuthenticationOptions = query(
  z.object({
    allowCredentials: z.array(allowCredentialsSchema).optional(),
    email: z.email().optional(),
  }),
  async ({ allowCredentials, email }) => {
    const event = getRequestEvent();

    if (!allowCredentials && email) {
      allowCredentials = await db
        .select({
          key: AccountAuthenticators.key,
          credential: AccountAuthenticators.credential,
        })
        .from(AccountAuthenticators)
        .innerJoin(Emails, eq(AccountAuthenticators.accountId, Emails.accountId))
        .where(and(eq(Emails.email, email), isNotNull(Emails.verifiedAt)))
        .then((rows) => filterPasskeyCredentialsAndParse(rows));
    }

    const options = await generateAuthenticationOptions({
      rpID: publicEnv.PUBLIC_PASSKEY_RP_ID,
      userVerification: 'preferred',
      allowCredentials,
    });

    await saveChallenge({ challenge: options.challenge, deviceId: event.locals.deviceId });
    return options;
  },
);

const responseSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
    userHandle: z.string().optional(),
  }),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  clientExtensionResults: z.record(z.string(), z.any()),
  type: z.literal('public-key'),
});

export const verifyPasskeyAuthentication = command(
  z.object({ response: responseSchema }),
  async ({ response }) => {
    const request = getRequestEvent();

    const expectedChallenge = await getChallenge(request.locals.deviceId);
    if (!expectedChallenge) {
      throw error(400, { message: 'verification_failed' });
    }

    const credential = await db
      .select({
        accountId: AccountAuthenticators.accountId,
        key: AccountAuthenticators.key,
        credential: AccountAuthenticators.credential,
      })
      .from(AccountAuthenticators)
      .where(eq(AccountAuthenticators.key, response.id))
      .then(first);

    if (!credential?.key) {
      throw error(400, { message: 'verification_failed' });
    }

    console.log(credential.credential.publicKey);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: publicEnv.PUBLIC_ORIGIN,
      expectedRPID: publicEnv.PUBLIC_PASSKEY_RP_ID,
      requireUserVerification: false,
      credential: {
        id: credential.key,
        publicKey: Uint8Array.fromBase64(credential.credential.publicKey),
        counter: credential.credential.counter,
        transports: credential.credential.transports,
      },
    });

    if (!verification.verified) {
      throw error(400, { message: 'verification_failed' });
    }

    db.update(AccountAuthenticators)
      .set({
        credential: sql`jsonb_set(credential, '{counter}', ${verification.authenticationInfo.newCounter}::jsonb)`,
      })
      .where(eq(AccountAuthenticators.key, credential.key));

    await createSession({ accountId: credential.accountId, cookies: request.cookies });

    return { success: true };
  },
);
