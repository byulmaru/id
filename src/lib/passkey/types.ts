import { z } from 'zod';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import type { AccountAuthenticatorCredential } from '$lib/server/db';

const credentialTransports = [
  'ble',
  'cable',
  'hybrid',
  'internal',
  'nfc',
  'smart-card',
  'usb',
] as const satisfies AuthenticatorTransportFuture[];

export const passkeyAccountAuthenticatorCredentialSchema = z.object({
  kind: z.literal('PASSKEY'),
  publicKey: z.string(),
  counter: z.number(),
  transports: z.array(z.enum(credentialTransports)).optional(),
});

export type PasskeyAccountAuthenticatorCredential = z.infer<
  typeof passkeyAccountAuthenticatorCredentialSchema
>;

export const filterPasskeyCredentialsAndParse = (
  rows: { key: string | null; credential: AccountAuthenticatorCredential }[],
) => {
  return rows
    .filter(
      (row): row is { key: string; credential: PasskeyAccountAuthenticatorCredential } =>
        row.credential.kind === 'PASSKEY' && !!row.key,
    )
    .map((row) => ({
      id: row.key,
      transports: row.credential.transports,
    }));
};
