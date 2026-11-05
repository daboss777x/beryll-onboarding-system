import "server-only";
import { markAiFailure, type AiMode } from "./client";

/**
 * Starts a live stream and waits for its first chunk, so a failing request (bad key, timeout)
 * is detected before the HTTP response starts and we can switch to the fallback.
 * Returns null on failure (and logs + cools the client down).
 */
export async function primeLiveStream(start: () => Promise<AsyncIterable<string>>, where: string): Promise<AsyncIterable<string> | null> {
  try {
    const it = (await start())[Symbol.asyncIterator]();
    const first = await it.next();
    if (first.done) return null;
    return (async function* () {
      yield first.value;
      while (true) {
        const n = await it.next();
        if (n.done) return;
        yield n.value;
      }
    })();
  } catch (e) {
    markAiFailure(e, where);
    return null;
  }
}

/** Yields canned text in word-sized chunks so fallback replies stream like live ones. */
export async function* textChunks(text: string): AsyncIterable<string> {
  const parts = text.match(/\S+\s*/g) ?? [text];
  for (const p of parts) yield p;
}

export interface StreamResponseOptions {
  mode: AiMode;
  headers?: Record<string, string>;
  /** Appended after the text (e.g. the coach's meta line). Receives the full streamed text. */
  trailer?: (fullText: string) => string | Promise<string>;
  /**
   * Runs once the source is fully consumed (also when the client disconnected mid-stream).
   * `text` excludes any drop notice; `complete` is false if the source failed part-way.
   * Errors are logged, never thrown.
   */
  onDone?: (text: string, complete: boolean) => void | Promise<void>;
}

/** Plain-text streaming Response. A mid-stream failure ends the text with a short notice. */
export function textStreamResponse(source: AsyncIterable<string>, opts: StreamResponseOptions): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      // After a client disconnect enqueue throws; keep consuming so onDone still sees the text.
      let open = true;
      const push = (t: string) => {
        if (!open) return;
        try {
          controller.enqueue(enc.encode(t));
        } catch {
          open = false;
        }
      };
      let text = "";
      let full = "";
      let complete = true;
      try {
        for await (const chunk of source) {
          text += chunk;
          push(chunk);
        }
        full = text;
      } catch (e) {
        markAiFailure(e, "stream");
        complete = false;
        const note = " … (connection dropped, please send that again)";
        full = text + note;
        push(note);
      }
      if (opts.onDone) {
        try {
          await opts.onDone(text, complete);
        } catch (e) {
          console.warn(`[ai] stream onDone failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      }
      if (opts.trailer) {
        try {
          push(await opts.trailer(full));
        } catch (e) {
          console.warn(`[ai] stream trailer failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      }
      if (open) {
        try {
          controller.close();
        } catch {
          /* already cancelled */
        }
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      "X-AI-Mode": opts.mode,
      ...opts.headers,
    },
  });
}

/** Reads a whole stream into a string (tests / non-streaming callers). */
export async function collect(source: AsyncIterable<string>): Promise<string> {
  let s = "";
  for await (const c of source) s += c;
  return s;
}
