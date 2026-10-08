// Placeholder until the OIDC (PKCE) login is wired in. Every API call attaches
// this bearer token; the backend resolves it through the entitlement service.
export async function getAccessToken(): Promise<string> {
  return 'dev-token';
}
