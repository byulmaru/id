import { db } from '$lib/server/db';

const gracefulShutdown = async () => {
  await db.$client.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
