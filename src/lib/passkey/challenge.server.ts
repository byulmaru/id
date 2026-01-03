import { eq } from 'drizzle-orm';
import { Temporal } from 'temporal-polyfill';
import { Challenges, db, first } from '$lib/server/db';

type SaveChallengeParams = {
  challenge: string;
  deviceId: string;
};
export const saveChallenge = async ({ challenge, deviceId }: SaveChallengeParams) => {
  await db
    .insert(Challenges)
    .values({
      challenge,
      deviceId,
      expiresAt: Temporal.Now.instant().add({ minutes: 3 }),
    })
    .onConflictDoUpdate({
      target: [Challenges.deviceId],
      set: {
        challenge,
        expiresAt: Temporal.Now.instant().add({ minutes: 3 }),
      },
    });
};

export const getChallenge = async (deviceId: string) => {
  const challenge = await db
    .delete(Challenges)
    .where(eq(Challenges.deviceId, deviceId))
    .returning({ challenge: Challenges.challenge, expiresAt: Challenges.expiresAt })
    .then(first);

  if (
    challenge?.challenge &&
    Temporal.Instant.compare(challenge.expiresAt, Temporal.Now.instant()) > 0
  ) {
    return challenge.challenge;
  }

  return null;
};
