import { delay, http, HttpResponse } from 'msw';
import type { Conversation, Message } from '../api/types';
import { conversations, entitlements, MOCK_VALID_TOKENS, type StoredConversation } from './data';

const BASE = '/api/v1';
const SCOPE = `${BASE}/clients/:clientId/products/:productId`;

type ScopeParams = { clientId: string; productId: string };
type ConvParams = ScopeParams & { conversationId: string };

const problem = (status: number, title: string, detail?: string) =>
  HttpResponse.json({ status, title, detail }, { status, headers: { 'Content-Type': 'application/problem+json' } });

/** Same checks the backend does: valid bearer token, then (client, product) entitlement. */
function authorize(request: Request, params?: ScopeParams): Response | null {
  const header = request.headers.get('Authorization') ?? '';
  if (!header.startsWith('Bearer ')) return problem(401, 'Unauthorized', 'Missing bearer token');
  if (!MOCK_VALID_TOKENS.includes(header.slice(7).trim())) {
    return problem(401, 'Unauthorized', 'Token is invalid or expired');
  }
  if (params) {
    const client = entitlements.clients.find((c) => c.id === params.clientId);
    if (!client?.products.some((p) => p.id === params.productId)) {
      return problem(403, 'Forbidden', 'Not entitled to this client/product');
    }
  }
  return null;
}

function findConversation(p: ConvParams): StoredConversation | undefined {
  return conversations.find(
    (c) => c.id === p.conversationId && c.clientId === p.clientId && c.productId === p.productId,
  );
}

const toDto = ({ messages: _messages, ...c }: StoredConversation): Conversation => c;

function fakeAnswer(question: string, clientId: string, productId: string): string {
  const client = entitlements.clients.find((c) => c.id === clientId)!;
  const product = client.products.find((p) => p.id === productId)!;
  return [
    `Here's what I found for **${client.name} / ${product.name}** regarding:`,
    `> ${question}`,
    [
      'Based on the internal documents available for this product:',
      '1. The most recent figures are within expected ranges.',
      '2. No open incidents are linked to this topic.',
      '3. The owning team last updated the related runbook this month.',
    ].join('\n'),
    '_This is a mocked response — the real answer will come from OrgAI._',
  ].join('\n\n');
}

export const handlers = [
  http.get(`${BASE}/me/entitlements`, async ({ request }) => {
    await delay(200);
    return authorize(request) ?? HttpResponse.json(entitlements);
  }),

  http.get<ScopeParams>(`${SCOPE}/conversations`, async ({ request, params }) => {
    await delay(150);
    const denied = authorize(request, params);
    if (denied) return denied;
    const items = conversations
      .filter((c) => c.clientId === params.clientId && c.productId === params.productId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toDto);
    return HttpResponse.json({ items });
  }),

  http.post<ScopeParams, { title?: string }>(`${SCOPE}/conversations`, async ({ request, params }) => {
    const denied = authorize(request, params);
    if (denied) return denied;
    const body = await request.json();
    const now = new Date().toISOString();
    const conv: StoredConversation = {
      id: crypto.randomUUID(),
      clientId: params.clientId,
      productId: params.productId,
      title: body?.title || 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    conversations.push(conv);
    return HttpResponse.json(toDto(conv), { status: 201 });
  }),

  http.patch<ConvParams, { title: string }>(`${SCOPE}/conversations/:conversationId`, async ({ request, params }) => {
    const denied = authorize(request, params);
    if (denied) return denied;
    const conv = findConversation(params);
    if (!conv) return problem(404, 'Not Found');
    conv.title = (await request.json()).title;
    return HttpResponse.json(toDto(conv));
  }),

  http.delete<ConvParams>(`${SCOPE}/conversations/:conversationId`, ({ request, params }) => {
    const denied = authorize(request, params);
    if (denied) return denied;
    const idx = conversations.findIndex((c) => c === findConversation(params));
    if (idx < 0) return problem(404, 'Not Found');
    conversations.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get<ConvParams>(`${SCOPE}/conversations/:conversationId/messages`, async ({ request, params }) => {
    await delay(150);
    const denied = authorize(request, params);
    if (denied) return denied;
    const conv = findConversation(params);
    if (!conv) return problem(404, 'Not Found');
    return HttpResponse.json({ items: conv.messages });
  }),

  http.post<ConvParams, { content: string }>(
    `${SCOPE}/conversations/:conversationId/messages`,
    async ({ request, params }) => {
      const denied = authorize(request, params);
      if (denied) return denied;
      const conv = findConversation(params);
      if (!conv) return problem(404, 'Not Found');

      const { content } = await request.json();
      const now = new Date().toISOString();
      const userMsg: Message = { id: crypto.randomUUID(), role: 'USER', content, status: 'COMPLETE', createdAt: now };
      const assistant: Message = { id: crypto.randomUUID(), role: 'ASSISTANT', content: '', status: 'STREAMING', createdAt: now };
      conv.messages.push(userMsg, assistant);
      conv.updatedAt = now;
      if (conv.title === 'New chat') conv.title = content.length > 40 ? `${content.slice(0, 40)}…` : content;

      const answer = fakeAnswer(content, params.clientId, params.productId);
      const citations = [
        { title: 'Product runbook', url: '#' },
        { title: 'Quarterly report', url: '#' },
      ];
      const encoder = new TextEncoder();
      const send = (c: ReadableStreamDefaultController, event: string, data: unknown) =>
        c.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      const stream = new ReadableStream({
        async start(controller) {
          send(controller, 'meta', { userMessageId: userMsg.id, assistantMessageId: assistant.id });
          await delay(500); // "thinking"
          for (const token of answer.split(/(?<=\s)/)) {
            assistant.content += token;
            send(controller, 'delta', { text: token });
            await delay(25);
          }
          assistant.status = 'COMPLETE';
          assistant.citations = citations;
          send(controller, 'done', { citations });
          controller.close();
        },
      });
      return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    },
  ),
];
