export const SUPPORTED_SCOPES = ['openid', 'profile', 'email'] as const;
export type SupportedScope = (typeof SUPPORTED_SCOPES)[number];

export const parseScopes = (scopeString?: string): string[] => {
  if (!scopeString) {return [];}
  return scopeString.split(' ').filter((scope) => scope.length > 0);
};

export const isOIDCRequest = (scopes: string[]): boolean => {
  return scopes.includes('openid');
};

export const validateScopes = (requestedScopes: string[], supportedScopes: string[]): boolean => {
  return requestedScopes.every((scope) => supportedScopes.includes(scope));
};

export const filterSupportedScopes = (requestedScopes: string[]): string[] => {
  return requestedScopes.filter((scope) => (SUPPORTED_SCOPES as readonly string[]).includes(scope));
};
