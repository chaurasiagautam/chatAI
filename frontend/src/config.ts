// Every URL the UI uses comes from .env and is resolved here. Nothing in src/
// hard-codes an API URL or path, or reads import.meta.env directly.

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`Missing ${name} — set it in frontend/.env`);
  return value;
}

export const config = {
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  apiBaseUrl: required('VITE_API_BASE_URL').replace(/\/+$/, ''),
};

type Params = Record<string, string>;

/**
 * Builds an endpoint from a path template in .env, e.g.
 * `/clients/{clientId}/products/{productId}/conversations`. Values are inserted as
 * given: the API client passes URL-encoded ids, the MSW mocks pass `:param` patterns.
 */
function endpoint(name: keyof ImportMetaEnv) {
  const template = required(name);
  return (params: Params = {}) =>
    config.apiBaseUrl +
    template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = params[key];
      if (value === undefined) throw new Error(`${name} needs {${key}}`);
      return value;
    });
}

/** REST endpoints (docs/architecture.md §6). Paths are configured in .env. */
export const endpoints = {
  entitlements: endpoint('VITE_API_ENTITLEMENTS_PATH'),
  conversations: endpoint('VITE_API_CONVERSATIONS_PATH'),
  conversation: endpoint('VITE_API_CONVERSATION_PATH'),
  messages: endpoint('VITE_API_MESSAGES_PATH'),
};

/** Resolves an endpoint against the page origin, so relative and absolute base URLs both work. */
export const toUrl = (endpoint: string) => new URL(endpoint, window.location.origin);
