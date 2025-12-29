import { customType } from 'drizzle-orm/pg-core';

export const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => 'bytea',
  toDriver: (value) => value,
  fromDriver: (value) => value,
});

export const datetime = customType<{ data: Temporal.Instant; driverData: Date }>({
  dataType: () => 'timestamp with time zone',
  fromDriver: (value) => value.toTemporalInstant(),
  toDriver: (value) => new Date(value.epochMilliseconds),
});

export const jsonb = customType<{ data: unknown; driverData: unknown }>({
  dataType: () => 'jsonb',
  toDriver: (value) => JSON.stringify(value),
  fromDriver: (value) => value,
});
