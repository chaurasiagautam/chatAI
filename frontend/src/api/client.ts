import { clearToken, getAccessToken } from '../auth/token';
import { endpoints, toUrl } from '../config';
import { readSse } from './sse';
import type { ChatStreamEvent, Conversation, Entitlements, Message, Page, Problem } from './types';

export class ApiError extends Error {
  constructor(public readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }
}

async function request(url: string, init: RequestInit = {}, token = getAccessToken()): Promise<Response> {
  const res = await fetch(toUrl(url), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  // Token rejected (expired/revoked) while signed in: drop it so the sign-in screen shows again.
  if (res.status === 401 && token === tryGetToken()) clearToken();
  if (!res.ok) {
    const problem: Problem = await res
      .json()
      .catch(() => ({ status: res.status, title: res.statusText }));
    throw new ApiError(problem);
  }
  return res;
}

function tryGetToken(): string | null {
  try {
    return getAccessToken();
  } catch {
    return null;
  }
}

async function json<T>(url: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await request(url, init, token);
  return res.status === 204 ? (undefined as T) : res.json();
}

const enc = encodeURIComponent;

export const api = {
  entitlements: () => json<Entitlements>(endpoints.entitlements()),

  /** Validates a pasted token: the backend resolves it via the entitlement service (401 if invalid). */
  verifyToken: (token: string) => json<Entitlements>(endpoints.entitlements(), undefined, token),

  listConversations: (clientId: string, productId: string) =>
    json<Page<Conversation>>(endpoints.conversations(enc(clientId), enc(productId))),

  createConversation: (clientId: string, productId: string, title?: string) =>
    json<Conversation>(endpoints.conversations(enc(clientId), enc(productId)), {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  renameConversation: (clientId: string, productId: string, id: string, title: string) =>
    json<Conversation>(endpoints.conversation(enc(clientId), enc(productId), enc(id)), {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (clientId: string, productId: string, id: string) =>
    json<void>(endpoints.conversation(enc(clientId), enc(productId), enc(id)), { method: 'DELETE' }),

  listMessages: (clientId: string, productId: string, id: string) =>
    json<Page<Message>>(endpoints.messages(enc(clientId), enc(productId), enc(id))),

  async *sendMessage(
    clientId: string,
    productId: string,
    conversationId: string,
    content: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const res = await request(endpoints.messages(enc(clientId), enc(productId), enc(conversationId)), {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify({ content, clientRequestId: crypto.randomUUID() }),
      signal,
    });
    if (!res.body) throw new Error('Empty stream');
    yield* readSse(res.body);
  },
};
