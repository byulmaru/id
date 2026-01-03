import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import { error } from '@sveltejs/kit';
import aaguids from 'aaguids';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { command, getRequestEvent, query } from '$app/server';
import { env as publicEnv } from '$env/dynamic/public';
import { AccountAuthenticators, db } from '$lib/server/db';
import { getChallenge, saveChallenge } from './challenge.server';
import { RP_NAME } from './const';
import { filterPasskeyCredentialsAndParse } from './types';

export const generatePasskeyRegistrationOptions = query(async () => {
  const event = getRequestEvent();
  if (!event?.locals.session) {
    throw error(401, { message: 'unauthorized' });
  }

  const excludeCredentials = await db
    .select({ key: AccountAuthenticators.key, credential: AccountAuthenticators.credential })
    .from(AccountAuthenticators)
    .where(
      and(
        eq(AccountAuthenticators.accountId, event.locals.session.account.id),
        eq(AccountAuthenticators.kind, 'PASSKEY'),
      ),
    )
    .then((rows) => filterPasskeyCredentialsAndParse(rows));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: publicEnv.PUBLIC_PASSKEY_RP_ID,

    userName: event.locals.session.account.name,
    userID: isoUint8Array.fromUTF8String(event.locals.session.account.id),

    excludeCredentials,
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      residentKey: 'preferred',
    },
  });

  await saveChallenge({ challenge: options.challenge, deviceId: event.locals.deviceId });

  return options;
});

const responseSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    attestationObject: z.string(),
    clientExtensionResults: z.any().optional(),
    authenticatorData: z.string().optional(),
    transports: z
      .array(z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']))
      .optional(),
    publicKeyAlgorithm: z.number().optional(),
    publicKey: z.string().optional(),
  }),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  clientExtensionResults: z.record(z.string(), z.any()),
  type: z.literal('public-key'),
});

export const verifyAndSavePasskey = command(
  z.object({ response: responseSchema }),
  async ({ response }) => {
    const event = getRequestEvent();
    if (!event?.locals.session) {
      throw error(401, { message: 'unauthorized' });
    }

    const expectedChallenge = await getChallenge(event.locals.deviceId);
    if (!expectedChallenge) {
      throw error(400, { message: 'verification_failed' });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: publicEnv.PUBLIC_ORIGIN,
      expectedRPID: publicEnv.PUBLIC_PASSKEY_RP_ID,
    });

    if (!verification.verified) {
      throw error(400, { message: 'verification_failed' });
    }

    await db.insert(AccountAuthenticators).values({
      accountId: event.locals.session.account.id,
      kind: 'PASSKEY',
      key: verification.registrationInfo.credential.id,
      credential: {
        kind: 'PASSKEY',
        publicKey: verification.registrationInfo.credential.publicKey.toBase64(),
        counter: verification.registrationInfo.credential.counter,
        transports: verification.registrationInfo.credential.transports,
      },
      name: aaguids[verification.registrationInfo.aaguid] ?? 'Passkey',
    });
  },
);

export const deletePasskey = command(z.object({ id: z.string() }), async ({ id }) => {
  const event = getRequestEvent();
  if (!event?.locals.session) {
    throw error(401, { message: 'unauthorized' });
  }

  await db
    .delete(AccountAuthenticators)
    .where(
      and(
        eq(AccountAuthenticators.id, id),
        eq(AccountAuthenticators.accountId, event.locals.session.account.id),
      ),
    );

  return { success: true };
});
