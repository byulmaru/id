import { json } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';

export const GET = async () => {
  return json({
    issuer: publicEnv.PUBLIC_OIDC_ISSUER,
    authorization_endpoint: `${publicEnv.PUBLIC_OIDC_ISSUER}/oauth/authorize`,
    token_endpoint: `${publicEnv.PUBLIC_OIDC_ISSUER}/oauth/token`,
    userinfo_endpoint: `${publicEnv.PUBLIC_OIDC_ISSUER}/userinfo`,
    jwks_uri: `${publicEnv.PUBLIC_OIDC_ISSUER}/jwks`,
    scopes_supported: ['openid', 'profile', 'email'],
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['EdRSA'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
  });
};
