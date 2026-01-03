import { eq } from 'drizzle-orm';
import { Temporal } from 'temporal-polyfill';
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

  return await db.transaction(async (tx) => {
    const expiresAt = match(purpose)
      .with('LOGIN', 'SIGN_UP', () => Temporal.Now.instant().add({ minutes: 10 }))
      .with('ADD_EMAIL', () => Temporal.Now.instant().add({ hours: 1 }))
      .exhaustive();

    const verification = await tx
      .insert(EmailVerifications)
      .values({
        emailId: email.id,
        purpose,
        code: token,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [EmailVerifications.emailId],
        set: {
          purpose,
          code: token,
          expiresAt,
        },
      })
      .returning({ id: EmailVerifications.id, expiresAt: EmailVerifications.expiresAt })
      .then(firstOrThrow);

    await sendEmail({
      subject: match(purpose)
        .with('LOGIN', () => '별마루 통합 계정 로그인하기')
        .with('SIGN_UP', () => '별마루 통합 계정 가입하기')
        .with('ADD_EMAIL', () => '별마루 통합 계정 이메일 추가 인증')
        .exhaustive(),
      recipient: email.email,
      body: match(purpose)
        .with('LOGIN', () =>
          Login({
            origin: siteOrigin,
            email: email.email,
            name: account!.name,
            code: token,
            verificationId: verification.id,
            expiresAt: verification.expiresAt,
          }),
        )
        .with('SIGN_UP', () =>
          Signup({
            origin: siteOrigin,
            email: email.email,
            code: token,
            verificationId: verification.id,
            expiresAt: verification.expiresAt,
          }),
        )
        .with('ADD_EMAIL', () =>
          AddEmailVerification({
            email: email.email,
            code: token,
            name: account!.name,
            expiresAt: verification.expiresAt,
          }),
        )
        .exhaustive(),
    });

    return verification;
  });
};
