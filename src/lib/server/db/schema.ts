import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgEnum, pgTable, unique, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { ulid } from 'ulidx';
import { datetime } from './types';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { PasskeyAccountAuthenticatorCredential } from '$lib/passkey/types';

export const AccountState = pgEnum('_account_state', ['ACTIVE', 'DELETED']);
export const Accounts = pgTable('accounts', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  primaryEmailId: varchar('primary_email_id')
    .notNull()
    .references((): AnyPgColumn => Emails.id),
  name: varchar('name').notNull(),
  state: AccountState('state').notNull().default('ACTIVE'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export type AccountAuthenticatorCredential = PasskeyAccountAuthenticatorCredential;
export const AccountAuthenticatorKind = pgEnum('_account_authenticator_kind', [
  'PASSWORD',
  'PASSKEY',
]);
export const AccountAuthenticators = pgTable(
  'account_authenticators',
  {
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    accountId: varchar('account_id')
      .notNull()
      .references(() => Accounts.id),
    kind: AccountAuthenticatorKind('kind').notNull(),
    key: varchar('key'),
    credential: jsonb('credential').notNull().$type<AccountAuthenticatorCredential>(),
    name: varchar('name'),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (t) => [unique().on(t.accountId, t.key).nullsNotDistinct()],
);

export const Challenges = pgTable('challenges', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  deviceId: varchar('device_id').notNull().unique(),
  challenge: varchar('challenge').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
  expiresAt: datetime('expires_at').notNull(),
});

export const Emails = pgTable(
  'emails',
  {
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    accountId: varchar('account_id').references(() => Accounts.id),
    email: varchar('email').notNull(),
    normalizedEmail: varchar('normalized_email').notNull(),
    createdAt: datetime('created_at')
      .notNull()
      .default(sql`now()`),
    verifiedAt: datetime('verified_at'),
  },
  (t) => [
    uniqueIndex()
      .on(t.normalizedEmail)
      .where(sql`${t.verifiedAt} IS NOT NULL`),
    uniqueIndex().on(t.accountId, t.normalizedEmail),
  ],
);

export const EmailVerificationPurpose = pgEnum('_email_verification_purpose', [
  'LOGIN',
  'SIGN_UP',
  'ADD_EMAIL',
]);
export const EmailVerifications = pgTable('email_verifications', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  emailId: varchar('email_id')
    .notNull()
    .unique()
    .references(() => Emails.id, { onDelete: 'cascade' }),
  purpose: EmailVerificationPurpose('purpose').notNull(),
  code: varchar('code'),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const OAuthApplications = pgTable('oauth_applications', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: varchar('name').notNull(),
  scopes: varchar('scopes')
    .array()
    .notNull()
    .default(sql`'{}'`),
  isSuperApp: boolean('is_super_app').notNull().default(false),
  createdAt: datetime('created_at'),
});

export const OAuthApplicationRedirectUris = pgTable('oauth_application_redirect_uris', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  applicationId: varchar('application_id')
    .notNull()
    .references(() => OAuthApplications.id),
  redirectUri: varchar('redirect_uri').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const OAuthApplicationSecrets = pgTable('oauth_application_secrets', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  applicationId: varchar('application_id')
    .notNull()
    .references(() => OAuthApplications.id),
  secret: varchar('secret').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const OAuthApplicationTokens = pgTable('oauth_application_tokens', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  applicationId: varchar('application_id')
    .notNull()
    .references(() => OAuthApplications.id),
  accountId: varchar('account_id')
    .notNull()
    .references(() => Accounts.id),
  redirectUriId: varchar('redirect_uri_id')
    .notNull()
    .references(() => OAuthApplicationRedirectUris.id),
  token: varchar('token').notNull(),
  scopes: varchar('scopes').array().notNull(),
  nonce: varchar('nonce'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
  expiresAt: datetime('expires_at').notNull(),
});

export const OAuthSessions = pgTable('oauth_sessions', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  applicationId: varchar('application_id')
    .notNull()
    .references(() => OAuthApplications.id),
  accountId: varchar('account_id')
    .notNull()
    .references(() => Accounts.id),
  token: varchar('token').notNull(),
  scopes: varchar('scopes').array().notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Sessions = pgTable('sessions', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  applicationId: varchar('application_id').references(() => OAuthApplications.id),
  accountId: varchar('account_id')
    .notNull()
    .references(() => Accounts.id),
  token: varchar('token').unique().notNull(),
  scopes: varchar('scopes')
    .array()
    .notNull()
    .default(sql`'{}'`),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});
