import { z } from 'zod';

export const addEmailSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요'),
});

export const verifyEmailSchema = z.object({
  emailId: z.string(),
  code: z.string().regex(/^\d{6}$/, '코드 형식이 맞지 않아요'),
});