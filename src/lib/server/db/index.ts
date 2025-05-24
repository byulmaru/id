import { drizzle } from 'drizzle-orm/neon-serverless';
import { DrizzleLogger } from './logger';
import * as schema from './schema';

export const getDatabase = async (connectionString: string) => {
  return drizzle(connectionString, {
    schema,
    logger: new DrizzleLogger(),
  });
};

export type Database = Awaited<ReturnType<typeof getDatabase>>;

export * from './schema';
export * from './utils';
