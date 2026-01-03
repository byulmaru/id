import { z } from 'zod';

export const deletePasskeySchema = z.object({
  id: z.string().ulid(),
});
