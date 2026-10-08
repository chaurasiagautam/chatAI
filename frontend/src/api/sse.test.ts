import { readSse } from './sse';

function streamOf(...chunks: string[]) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((s) => c.enqueue(enc.encode(s)));
      c.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const out = [];
  for await (const e of readSse(stream)) out.push(e);
  return out;
}

test('parses events split across chunks and skips heartbeats', async () => {
  const events = await collect(
    streamOf(
      'event: delta\ndata: {"text":"Hel',
      'lo"}\n\n: heartbeat\n\nevent: delta\r\ndata: {"text":" world"}\r\n\r\n',
      'event: done\ndata: {"citations":[]}\n\n',
    ),
  );
  expect(events).toEqual([
    { type: 'delta', text: 'Hello' },
    { type: 'delta', text: ' world' },
    { type: 'done', citations: [] },
  ]);
});
