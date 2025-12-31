import { eq } from 'drizzle-orm';
import { match } from 'ts-pattern';
import { Accounts, db, Emails, EmailVerifications, first, firstOrThrow } from '../db';
import { sendEmail } from '../email';
import AddEmailVerification from '../email/templates/AddEmailVerification';
import Login from '../email/templates/Login';
import Signup from '../email/templates/Signup';

export const sendEmailVerification = async (
  email: typeof Emails.$inferSelect,
  purpose: 'LOGIN' | 'SIGN_UP' | 'ADD_EMAIL',
  siteOrigin: string,
) => {
  const token = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');

  const account = email.accountId
    ? await db.select().from(Accounts).where(eq(Accounts.id, email.accountId)).then(first)
    : null;

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
            name: account!.name,
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
      .with('ADD_EMAIL', async () => {
        const verification = await tx
          .insert(EmailVerifications)
          .values({
            emailId: email.id,
            purpose: 'ADD_EMAIL',
            code: token,
            expiresAt: Temporal.Now.instant().add({ hours: 1 }),
          })
          .returning({ id: EmailVerifications.id, expiresAt: EmailVerifications.expiresAt })
          .then(firstOrThrow);

        await sendEmail({
          subject: '별마루 통합 계정 이메일 추가 인증',
          recipient: email.email,
          body: AddEmailVerification({
            email: email.email,
            code: token,
            name: account!.name,
            expiresAt: verification.expiresAt,
          }),
        });

        return verification;
      })
      .exhaustive(),
  );
};
