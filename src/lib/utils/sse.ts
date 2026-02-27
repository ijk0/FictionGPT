/**
 * SSEWriter provides methods to send Server-Sent Events over a writable stream.
 */
export interface SSEWriter {
  /** Send a named SSE event with JSON-serialized data. */
  sendEvent(event: string, data: unknown): void;
  /** Close the stream. No further events can be sent after calling this. */
  close(): void;
}

/**
 * Create a ReadableStream and an SSEWriter that pushes formatted SSE events
 * into the stream. The writer encodes each event as:
 *
 *   event: <name>\ndata: <json>\n\n
 *
 * Returns an object with `readable` (the ReadableStream to pass to Response)
 * and `writer` (used to push events and close the stream).
 */
export function createSSEStream(): { readable: ReadableStream; writer: SSEWriter } {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const readable = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
    cancel() {
      controller = null;
    },
  });

  const writer: SSEWriter = {
    sendEvent(event: string, data: unknown): void {
      if (!controller) return;
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      try {
        controller.enqueue(encoder.encode(payload));
      } catch {
        // Stream may already be closed; ignore.
      }
    },
    close(): void {
      if (!controller) return;
      try {
        controller.close();
      } catch {
        // Stream may already be closed; ignore.
      }
      controller = null;
    },
  };

  return { readable, writer };
}

/**
 * Wrap a ReadableStream as a Response with proper SSE headers.
 */
export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
