import { fail, redirect } from '@sveltejs/kit';
import { and, eq, isNotNull, ne, or } from 'drizzle-orm';
import normalizeEmail from 'normalize-email';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { Temporal } from 'temporal-polyfill';
import { sendEmailVerification } from '$lib/server/auth/sendEmailVerification';
import { Accounts, db, Emails, EmailVerifications, first, firstOrThrow } from '$lib/server/db';
import { sendEmail } from '$lib/server/email';
import PrimaryEmailChanged from '$lib/server/email/templates/PrimaryEmailChanged';
import { addEmailSchema, verifyEmailSchema } from './schema';

export const load = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/auth');
  }

  const emails = await Promise.all([
    db
      .select({
        id: Emails.id,
        email: Emails.email,
        verifiedAt: Emails.verifiedAt,
      })
      .from(Emails)
      .innerJoin(Accounts, eq(Accounts.primaryEmailId, Emails.id))
      .where(eq(Accounts.id, locals.session.account.id)),
    db
      .select({
        id: Emails.id,
        email: Emails.email,
        verifiedAt: Emails.verifiedAt,
      })
      .from(Emails)
      .innerJoin(Accounts, eq(Accounts.id, Emails.accountId))
      .where(
        and(eq(Accounts.id, locals.session.account.id), ne(Accounts.primaryEmailId, Emails.id)),
      )
      .orderBy(Emails.verifiedAt),
  ]).then(([primaryEmails, otherEmails]) => [
    ...primaryEmails.map((email) => ({ ...email, isPrimary: true })),
    ...otherEmails.map((email) => ({ ...email, isPrimary: false })),
  ]);

  const addEmailForm = await superValidate(zod4(addEmailSchema));
  const verifyEmailForm = await superValidate(zod4(verifyEmailSchema));

  return { emails, addEmailForm, verifyEmailForm };
};

export const actions = {
  addEmail: async ({ request, locals }) => {
    if (!locals.session) {
      throw redirect(303, '/auth');
    }

    const form = await superValidate(request, zod4(addEmailSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // 이미 같은 이메일이 있는지 확인
    const existingEmail = await db
      .select({ id: Emails.id })
      .from(Emails)
      .where(
        and(
          eq(Emails.normalizedEmail, normalizeEmail(form.data.email)),
          or(isNotNull(Emails.verifiedAt), eq(Emails.accountId, locals.session.account.id)),
        ),
      )
      .then(first);

    if (existingEmail) {
      return setError(form, 'email', '이미 등록된 이메일입니다');
    }

    // 새 이메일 레코드 생성
    const newEmail = await db
      .insert(Emails)
      .values({
        accountId: locals.session.account.id,
        email: form.data.email,
        normalizedEmail: normalizeEmail(form.data.email),
      })
      .returning()
      .then(firstOrThrow);

    await sendEmailVerification(newEmail, 'ADD_EMAIL', new URL(request.url).origin);

    return { form, email: { id: newEmail.id, email: newEmail.email } };
  },

  verifyEmail: async ({ request, locals }) => {
    if (!locals.session) {
      throw redirect(303, '/auth');
    }

    const form = await superValidate(request, zod4(verifyEmailSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // 인증 레코드 조회
    const verification = await db
      .select({
        id: EmailVerifications.id,
        expiresAt: EmailVerifications.expiresAt,
      })
      .from(EmailVerifications)
      .innerJoin(Emails, eq(EmailVerifications.emailId, Emails.id))
      .where(
        and(
          eq(EmailVerifications.emailId, form.data.emailId),
          eq(Emails.accountId, locals.session.account.id),
          eq(EmailVerifications.purpose, 'ADD_EMAIL'),
          eq(EmailVerifications.code, form.data.code),
        ),
      )
      .then(first);

    if (!verification) {
      return setError(form, 'code', '코드가 일치하지 않아요');
    }

    // 만료 여부 확인
    if (Temporal.Instant.compare(verification.expiresAt, Temporal.Now.instant()) < 0) {
      return setError(form, 'code', '코드가 만료되었어요. 다시 시도해 주세요.');
    }

    // 인증 처리 (트랜잭션 내에서)
    await db.transaction(async (tx) => {
      // 인증 레코드 삭제
      await tx.delete(EmailVerifications).where(eq(EmailVerifications.id, verification.id));

      // 이메일 인증 완료 처리
      await tx
        .update(Emails)
        .set({ verifiedAt: Temporal.Now.instant() })
        .where(eq(Emails.id, form.data.emailId));
    });

    return { form };
  },

  setPrimary: async ({ request, locals }) => {
    if (!locals.session) {
      throw redirect(303, '/auth');
    }

    const emailId = await request.formData().then((formData) => formData.get('emailId'));

    if (typeof emailId !== 'string') {
      return fail(400, {
        error: '유효하지 않은 요청입니다',
      });
    }

    // 이메일이 현재 사용자의 것인지 확인
    const email = await db
      .select({ id: Emails.id, email: Emails.email })
      .from(Emails)
      .where(
        and(
          eq(Emails.id, emailId),
          eq(Emails.accountId, locals.session.account.id),
          isNotNull(Emails.verifiedAt),
        ),
      )
      .then(first);

    if (!email) {
      return fail(404, {
        error: '이메일을 찾을 수 없습니다',
      });
    }

    // 주 이메일 변경
    await db
      .update(Accounts)
      .set({ primaryEmailId: email.id })
      .where(eq(Accounts.id, locals.session.account.id));

    await sendEmail({
      subject: '별마루 계정의 주 이메일이 변경되었어요',
      recipient: locals.session.account.primaryEmail,
      body: PrimaryEmailChanged({
        name: locals.session.account.name,
        email: email.email,
      }),
    });

    return { success: true };
  },

  deleteEmail: async ({ request, locals }) => {
    if (!locals.session) {
      throw redirect(303, '/auth');
    }

    const emailId = await request.formData().then((formData) => formData.get('emailId'));

    if (typeof emailId !== 'string') {
      return fail(400, {
        error: '유효하지 않은 요청입니다',
      });
    }

    // 주 이메일인지 확인
    if (locals.session.account.primaryEmailId === emailId) {
      return fail(400, {
        error: '주 이메일은 삭제할 수 없습니다',
      });
    }

    // 이메일이 현재 사용자의 것인지 확인
    const email = await db
      .select({ id: Emails.id })
      .from(Emails)
      .where(and(eq(Emails.id, emailId), eq(Emails.accountId, locals.session.account.id)))
      .then(first);

    if (!email) {
      return fail(404, {
        error: '이메일을 찾을 수 없습니다',
      });
    }

    // 이메일 삭제
    await db.delete(Emails).where(eq(Emails.id, email.id));

    return { success: true };
  },
};
