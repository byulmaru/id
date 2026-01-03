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

