import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { api } from '../api/client';
import type { Message } from '../api/types';
import { sendMessage, stopStreaming, useIsStreaming } from '../hooks/chat';
import { keys, useConversations, useMessages, useScopeNames } from '../hooks/queries';
import { Composer } from './Composer';
import { MessageList } from './MessageList';

const SUGGESTIONS = [
  'Summarise the latest quarterly report',
  'Are there any open incidents?',
  'What changed in the last release?',
  'Who owns the onboarding runbook?',
];

export function ChatView() {
  const { clientId = '', productId = '', conversationId } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { client, product } = useScopeNames(clientId, productId);
  const { data: messages, isLoading, isError } = useMessages(clientId, productId, conversationId);
  const { data: conversations } = useConversations(clientId, productId);
  const streaming = useIsStreaming(conversationId);

  if (client && !product) {
    return <div className="center-note">You are not entitled to this product.</div>;
  }

  const title = conversations?.find((c) => c.id === conversationId)?.title;
  const scopeLabel = client && product ? `${client.name} · ${product.name}` : '';

  const send = async (text: string) => {
    let id = conversationId;
    if (!id) {
      // First message of a new chat: create the conversation, then move to its URL.
      const conv = await api.createConversation(clientId, productId);
      id = conv.id;
      qc.setQueryData<Message[]>(keys.messages(clientId, productId, id), []);
      navigate(`/c/${clientId}/p/${productId}/${id}`, { replace: true });
    }
    await sendMessage(qc, clientId, productId, id, text);
  };

  const empty = !conversationId || (messages && messages.length === 0);

  return (
    <section className="chat">
      <header className="chat__header">
        <span className="chat__scope">{scopeLabel}</span>
        {title && <span className="chat__title">{title}</span>}
      </header>

      <div className="chat__scroll">
        {isError ? (
          <div className="center-note">This conversation could not be loaded.</div>
        ) : isLoading ? (
          <div className="center-note">Loading…</div>
        ) : empty ? (
          <div className="welcome">
            <h1>What can I help you with?</h1>
            <p>
              Ask anything about <strong>{product?.name}</strong> for <strong>{client?.name}</strong>.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion" onClick={() => void send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <MessageList messages={messages ?? []} />
        )}
      </div>

      <div className="chat__composer">
        <Composer
          placeholder={product ? `Message ${product.name}…` : 'Message…'}
          streaming={streaming}
          disabled={!product}
          onSend={(t) => void send(t)}
          onStop={() => conversationId && stopStreaming(conversationId)}
        />
        <p className="chat__disclaimer">Answers are generated from internal data and may be incomplete. Verify before use.</p>
      </div>
    </section>
  );
}
