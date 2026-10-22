import type { ChatStreamEvent } from './types';

/**
 * Parses a text/event-stream body. Native EventSource can't POST or send an
 * Authorization header, so the stream is read from fetch() instead.
 */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const event = parseEvent(buffer.slice(0, sep));
        buffer = buffer.slice(sep + 2);
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseEvent(raw: string): ChatStreamEvent | null {
  let name = 'message';
  const data: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue; // heartbeat comment
    if (line.startsWith('event:')) name = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return null;
  return { type: name, ...JSON.parse(data.join('\n')) } as ChatStreamEvent;
}
