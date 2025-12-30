import { getLogger } from '@logtape/drizzle-orm';
import { drizzle } from 'drizzle-orm/bun-sql';
import { env } from '$env/dynamic/private';
import * as schema from './schema';
import type { PgDatabase, PgTransaction } from 'drizzle-orm/pg-core';

// Initialize database connection at module load time
export const db = drizzle(env.DATABASE_URL, {
  schema,
  logger: getLogger(),
});

export type Database = typeof db;
export type Transaction =
  Database extends PgDatabase<infer T, infer U, infer V> ? PgTransaction<T, U, V> : never;

export * from './schema';
export * from './utils';
