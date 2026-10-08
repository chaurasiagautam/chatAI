import type { QueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { api } from '../api/client';
import type { Message } from '../api/types';
import { keys } from './queries';

// Abort controllers for in-flight answers, keyed by conversation id. Kept outside
// React so a stream keeps filling the cache if the user switches chats mid-answer.
const inFlight = new Map<string, AbortController>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useIsStreaming(conversationId: string | undefined): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => !!conversationId && inFlight.has(conversationId),
  );
}

export function stopStreaming(conversationId: string) {
  inFlight.get(conversationId)?.abort();
}

export async function sendMessage(
  qc: QueryClient,
  clientId: string,
  productId: string,
  conversationId: string,
  content: string,
): Promise<void> {
  const key = keys.messages(clientId, productId, conversationId);
  const update = (fn: (msgs: Message[]) => Message[]) => qc.setQueryData<Message[]>(key, (old) => fn(old ?? []));
  const patchAssistant = (id: string, fn: (m: Message) => Message) =>
    update((msgs) => msgs.map((m) => (m.id === id ? fn(m) : m)));

  const now = new Date().toISOString();
  let userId = `tmp-u-${crypto.randomUUID()}`;
  let assistantId = `tmp-a-${crypto.randomUUID()}`;
  update((msgs) => [
    ...msgs,
    { id: userId, role: 'USER', content, status: 'COMPLETE', createdAt: now },
    { id: assistantId, role: 'ASSISTANT', content: '', status: 'STREAMING', createdAt: now },
  ]);

  const controller = new AbortController();
  inFlight.set(conversationId, controller);
  emit();
  try {
    for await (const event of api.sendMessage(clientId, productId, conversationId, content, controller.signal)) {
      switch (event.type) {
        case 'meta': {
          const [tmpU, tmpA] = [userId, assistantId];
          userId = event.userMessageId;
          assistantId = event.assistantMessageId;
          update((msgs) =>
            msgs.map((m) => (m.id === tmpU ? { ...m, id: userId } : m.id === tmpA ? { ...m, id: assistantId } : m)),
          );
          void qc.invalidateQueries({ queryKey: keys.conversations(clientId, productId) });
          break;
        }
        case 'delta':
          patchAssistant(assistantId, (m) => ({ ...m, content: m.content + event.text }));
          break;
        case 'done':
          patchAssistant(assistantId, (m) => ({ ...m, status: 'COMPLETE', citations: event.citations }));
          break;
        case 'error':
          patchAssistant(assistantId, (m) => ({ ...m, status: 'FAILED', content: m.content || event.message }));
          break;
      }
    }
  } catch (err) {
    const stopped = controller.signal.aborted;
    patchAssistant(assistantId, (m) => ({
      ...m,
      status: stopped ? 'COMPLETE' : 'FAILED',
      content: stopped ? m.content : m.content || (err instanceof Error ? err.message : 'Something went wrong'),
    }));
  } finally {
    // Stream ended without a done/error event.
    patchAssistant(assistantId, (m) => (m.status === 'STREAMING' ? { ...m, status: 'COMPLETE' } : m));
    inFlight.delete(conversationId);
    emit();
    void qc.invalidateQueries({ queryKey: keys.conversations(clientId, productId) });
  }
}
