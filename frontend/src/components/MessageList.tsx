import { useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../api/types';

export function MessageList({ messages }: { messages: Message[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];

  // Follow the answer as it streams in.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, last?.content]);

  return (
    <div className="messages">
      {messages.map((m) =>
        m.role === 'USER' ? (
          <div key={m.id} className="msg msg--user">
            <div className="msg__bubble">{m.content}</div>
          </div>
        ) : (
          <div key={m.id} className={`msg msg--assistant${m.status === 'FAILED' ? ' msg--failed' : ''}`}>
            <span className="msg__avatar" aria-hidden="true">
              ◆
            </span>
            <div className="msg__body">
              {m.status === 'STREAMING' && !m.content ? (
                <span className="typing" aria-label="Thinking">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                <div className="markdown">
                  <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                </div>
              )}
              {m.status === 'FAILED' && <p className="msg__error">The answer could not be completed.</p>}
              {m.citations && m.citations.length > 0 && (
                <div className="citations">
                  <span>Sources</span>
                  {m.citations.map((c, i) => (
                    <a key={i} href={c.url} className="citation" target="_blank" rel="noreferrer">
                      [{i + 1}] {c.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
