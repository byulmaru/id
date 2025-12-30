import { z } from 'zod';

export const validationSchema = {
  name: z.string().trim().min(1, '닉네임을 입력해주세요').max(32, '닉네임은 32자 이하여야 해요'),
};
