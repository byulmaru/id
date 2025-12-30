import { match } from 'ts-pattern';
import { db, Emails, EmailVerifications, firstOrThrow } from '../db';
import { sendEmail } from '../email';
import Login from '../email/templates/Login';
import Signup from '../email/templates/Signup';

export const sendEmailVerification = async (
  email: typeof Emails.$inferSelect,
  purpose: 'LOGIN' | 'SIGN_UP',
  siteOrigin: string,
) => {
  const token = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');

  return await db.transaction(async (tx) =>
    match(purpose)
      .with('LOGIN', async () => {
        const verification = await tx
          .insert(EmailVerifications)
          .values({
            emailId: email.id,
            purpose: 'LOGIN',
            code: token,
            expiresAt: Temporal.Now.instant().add({ minutes: 10 }),
          })
          .returning({ id: EmailVerifications.id, expiresAt: EmailVerifications.expiresAt })
          .then(firstOrThrow);

        await sendEmail({
          subject: '별마루 통합 계정 로그인하기',
          recipient: email.email,
          body: Login({
            origin: siteOrigin,
            email: email.email,
            code: token,
            verificationId: verification.id,
            expiresAt: verification.expiresAt,
          }),
        });

        return verification;
      })
      .with('SIGN_UP', async () => {
        const verification = await tx
          .insert(EmailVerifications)
          .values({
            emailId: email.id,
            purpose: 'SIGN_UP',
            code: token,
            expiresAt: Temporal.Now.instant().add({ minutes: 10 }),
          })
          .returning({ id: EmailVerifications.id, expiresAt: EmailVerifications.expiresAt })
          .then(firstOrThrow);

        await sendEmail({
          subject: '별마루 통합 계정 가입하기',
          recipient: email.email,
          body: Signup({
            origin: siteOrigin,
            email: email.email,
            code: token,
            verificationId: verification.id,
            expiresAt: verification.expiresAt,
          }),
        });

        return verification;
      })
      .exhaustive(),
  );
};
