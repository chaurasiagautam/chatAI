// Every URL the UI uses is configured in .env and resolved here. Nothing else
// in src/ should hard-code an API path or read import.meta.env directly.

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`Missing ${name} — set it in frontend/.env`);
  return value;
}

export const config = {
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  apiBaseUrl: required('VITE_API_BASE_URL').replace(/\/+$/, ''),
};

/**
 * REST endpoints (docs/architecture.md §6). Arguments are inserted as given:
 * the API client passes URL-encoded ids, the MSW mocks pass `:param` patterns.
 */
export const endpoints = {
  entitlements: () => `${config.apiBaseUrl}/me/entitlements`,
  conversations: (clientId: string, productId: string) =>
    `${config.apiBaseUrl}/clients/${clientId}/products/${productId}/conversations`,
  conversation: (clientId: string, productId: string, conversationId: string) =>
    `${endpoints.conversations(clientId, productId)}/${conversationId}`,
  messages: (clientId: string, productId: string, conversationId: string) =>
    `${endpoints.conversation(clientId, productId, conversationId)}/messages`,
};

/** Resolves an endpoint against the page origin, so relative and absolute base URLs both work. */
export const toUrl = (endpoint: string) => new URL(endpoint, window.location.origin);
