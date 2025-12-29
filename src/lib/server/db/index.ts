import { drizzle } from 'drizzle-orm/bun-sql';
import { env } from '$env/dynamic/private';
import { DrizzleLogger } from './logger';
import * as schema from './schema';

// Initialize database connection at module load time
export const db = drizzle(env.DATABASE_URL, {
  schema,
  logger: new DrizzleLogger(),
});

export type Database = typeof db;

export * from './schema';
export * from './utils';
