import { z } from 'zod';
import { uriToRedirectUrl } from '$lib/url';

export const OAuthAuthorizeSchema = z.object({
  response_type: z.enum(['code']),
  client_id: z.string(),
  redirect_uri: z.string().url().transform(uriToRedirectUrl),
  state: z.string().max(4096).optional(),
});
