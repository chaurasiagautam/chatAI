import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export const keys = {
  entitlements: ['entitlements'] as const,
  conversations: (clientId: string, productId: string) => ['conversations', clientId, productId] as const,
  messages: (clientId: string, productId: string, conversationId: string) =>
    ['messages', clientId, productId, conversationId] as const,
};

export function useEntitlements() {
  return useQuery({ queryKey: keys.entitlements, queryFn: api.entitlements, staleTime: 5 * 60_000 });
}

export function useConversations(clientId: string, productId: string, enabled = true) {
  return useQuery({
    queryKey: keys.conversations(clientId, productId),
    queryFn: () => api.listConversations(clientId, productId).then((p) => p.items),
    enabled,
  });
}

export function useMessages(clientId: string, productId: string, conversationId: string | undefined) {
  return useQuery({
    queryKey: keys.messages(clientId, productId, conversationId ?? ''),
    queryFn: () => api.listMessages(clientId, productId, conversationId!).then((p) => p.items),
    enabled: !!conversationId,
    // Messages are appended locally while streaming; don't let a background refetch clobber them.
    staleTime: Infinity,
  });
}

/** Resolves client/product display names from the entitlements already loaded. */
export function useScopeNames(clientId?: string, productId?: string) {
  const { data } = useEntitlements();
  const client = data?.clients.find((c) => c.id === clientId);
  const product = client?.products.find((p) => p.id === productId);
  return { client, product };
}
