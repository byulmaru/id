import 'temporal-polyfill/global';

import { configure, getConsoleSink } from '@logtape/logtape';

await configure({
  sinks: { console: getConsoleSink() },
  loggers: [{ category: ['drizzle-orm'], sinks: ['console'], lowestLevel: 'debug' }],
});
