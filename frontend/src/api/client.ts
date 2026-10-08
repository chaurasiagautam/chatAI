import { getAccessToken } from '../auth/token';
import { readSse } from './sse';
import type { ChatStreamEvent, Conversation, Entitlements, Message, Page, Problem } from './types';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public readonly problem: Problem) {
    super(problem.detail ?? problem.title);
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(new URL(BASE + path, window.location.origin), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const problem: Problem = await res
      .json()
      .catch(() => ({ status: res.status, title: res.statusText }));
    throw new ApiError(problem);
  }
  return res;
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init);
  return res.status === 204 ? (undefined as T) : res.json();
}

const scope = (clientId: string, productId: string) =>
  `/clients/${encodeURIComponent(clientId)}/products/${encodeURIComponent(productId)}`;

export const api = {
  entitlements: () => json<Entitlements>('/me/entitlements'),

  listConversations: (clientId: string, productId: string) =>
    json<Page<Conversation>>(`${scope(clientId, productId)}/conversations`),

  createConversation: (clientId: string, productId: string, title?: string) =>
    json<Conversation>(`${scope(clientId, productId)}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  renameConversation: (clientId: string, productId: string, id: string, title: string) =>
    json<Conversation>(`${scope(clientId, productId)}/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (clientId: string, productId: string, id: string) =>
    json<void>(`${scope(clientId, productId)}/conversations/${id}`, { method: 'DELETE' }),

  listMessages: (clientId: string, productId: string, id: string) =>
    json<Page<Message>>(`${scope(clientId, productId)}/conversations/${id}/messages`),

  async *sendMessage(
    clientId: string,
    productId: string,
    conversationId: string,
    content: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const res = await request(`${scope(clientId, productId)}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify({ content, clientRequestId: crypto.randomUUID() }),
      signal,
    });
    if (!res.body) throw new Error('Empty stream');
    yield* readSse(res.body);
  },
};
