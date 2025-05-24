import { drizzle } from 'drizzle-orm/neon-serverless';
import { env } from '$env/dynamic/private';
import { DrizzleLogger } from './logger';
import * as schema from './schema';

export const db = drizzle(env.DATABASE_URL, {
  schema,
  logger: new DrizzleLogger(),
});

export * from './schema';
export * from './utils';
