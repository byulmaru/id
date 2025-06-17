import { sql } from 'drizzle-orm';
import { boolean, json, pgEnum, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { ulid } from 'ulidx';
import { datetime } from './types';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const AccountState = pgEnum('_account_state', ['ACTIVE', 'DELETED']);
export const Accounts = pgTable('accounts', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  primaryEmailId: varchar('primary_email_id')
    .notNull()
    .references((): AnyPgColumn => AccountEmails.id),
  name: varchar('name').notNull(),
  state: AccountState('state').notNull().default('ACTIVE'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const AccountAuthenticatorKind = pgEnum('_account_authenticator_kind', ['PASSWORD']);
export const AccountAuthenticators = pgTable('account_authenticators', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  accountId: varchar('account_id')
    .notNull()
    .references(() => Accounts.id),
  kind: AccountAuthenticatorKind('kind').notNull(),
  credential: json('credential').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const AccountEmails = pgTable(
  'account_emails',
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
  },
  (t) => [
    uniqueIndex()
      .on(t.normalizedEmail)
      .where(sql`${t.accountId} IS NOT NULL`),
  ],
);

export const AccountEmailVerifications = pgTable('account_email_verifications', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  accountEmailId: varchar('account_email_id')
    .notNull()
    .unique()
    .references(() => AccountEmails.id, { onDelete: 'cascade' }),
  code: varchar('code').notNull(),
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
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});

export const Sessions = pgTable('sessions', {
  id: varchar('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  accountId: varchar('account_id')
    .notNull()
    .references(() => Accounts.id),
  token: varchar('token').unique().notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`now()`),
});
