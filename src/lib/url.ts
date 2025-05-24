export const uriToRedirectUrl = (uri: string) => {
  const url = new URL(uri);
  url.hash = '';
  return url;
};
