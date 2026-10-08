// Mirrors the REST contract in docs/architecture.md §6.

export interface Product {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  products: Product[];
}

export interface Entitlements {
  userId: string;
  displayName: string;
  email: string;
  clients: Client[];
}

export interface Conversation {
  id: string;
  clientId: string;
  productId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'USER' | 'ASSISTANT';
export type MessageStatus = 'STREAMING' | 'COMPLETE' | 'FAILED';

export interface Citation {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  citations?: Citation[];
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

/** Events streamed by POST …/messages with Accept: text/event-stream. */
export type ChatStreamEvent =
  | { type: 'meta'; userMessageId: string; assistantMessageId: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; citations: Citation[] }
  | { type: 'error'; code: string; message: string };

/** RFC 9457 problem details. */
export interface Problem {
  status: number;
  title: string;
  detail?: string;
}
