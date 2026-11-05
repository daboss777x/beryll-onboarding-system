import "server-only";
import OpenAI from "openai";
import { z } from "zod";

/**
 * OpenAI access for every AI feature. Server-only.
 *
 * Env:
 *   OPENAI_API_KEY      optional. Missing => every feature runs in fallback mode.
 *   OPENAI_MODEL        default "gpt-4.1-mini"
 *   OPENAI_EMBED_MODEL  default "text-embedding-3-small" (1536 dims, matches sop_chunks.embedding)
 *
 * After a failed call the client "cools down" for COOLDOWN_MS so a live demo with a broken key
 * does not wait on a timeout for every message.
 */

export type AiMode = "live" | "fallback";

export const DEFAULT_MODEL = "gpt-4.1-mini";
export const DEFAULT_EMBED_MODEL = "text-embedding-3-small";
export const DEFAULT_TIMEOUT_MS = 20_000;
const COOLDOWN_MS = 60_000;

export function aiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}
export function embedModel(): string {
  return process.env.OPENAI_EMBED_MODEL?.trim() || DEFAULT_EMBED_MODEL;
}

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;
let downUntil = 0;

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = new OpenAI({ apiKey: key, timeout: DEFAULT_TIMEOUT_MS, maxRetries: 1 });
    cachedKey = key;
  }
  return cachedClient;
}

/** true when a key is configured and the client is not cooling down after a failure. */
export function isLive(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim()) && Date.now() >= downUntil;
}

export function aiModeNow(): AiMode {
  return isLive() ? "live" : "fallback";
}

/** Log (never throw) and pause live calls briefly. Messages never include the key. */
export function markAiFailure(err: unknown, where: string): void {
  downUntil = Date.now() + COOLDOWN_MS;
  console.warn(`[ai] ${where} failed, using fallback: ${describeError(err)}`);
}

/** Test hook. */
export function resetAiCooldown(): void {
  downUntil = 0;
}

export function describeError(err: unknown): string {
  if (err instanceof OpenAI.APIError) return `${err.name} ${err.status ?? ""} ${err.message}`.slice(0, 200);
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 200);
  return "unknown error";
}

export class AiUnavailableError extends Error {
  constructor() {
    super("OpenAI is not configured");
    this.name = "AiUnavailableError";
  }
}
export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Minimal surface of the SDK we use, so tests can pass a fake. */
export type ChatClient = Pick<OpenAI, "chat">;
export type EmbedClient = Pick<OpenAI, "embeddings">;

export interface CallOptions {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  timeoutMs?: number;
  client?: ChatClient;
}

function requireClient<T>(c: T | null | undefined): T {
  if (!c) throw new AiUnavailableError();
  return c;
}

/**
 * Reasoning models (gpt-5*, gpt-6*, o-series) reject a custom temperature and spend hidden
 * reasoning tokens out of max_completion_tokens. For them: no temperature, low effort, and
 * extra headroom so short replies are not starved. Other models keep temperature as before.
 */
export const REASONING_HEADROOM_TOKENS = 1024;
export function isReasoningModel(model: string): boolean {
  return /^(gpt-[5-9]|o\d)/i.test(model.trim());
}
export function samplingParams(model: string, maxTokens: number, temperature: number) {
  return isReasoningModel(model)
    ? { max_completion_tokens: maxTokens + REASONING_HEADROOM_TOKENS, reasoning_effort: "low" as const }
    : { max_completion_tokens: maxTokens, temperature };
}

/** Streams the assistant's text. Rejects if the request fails before streaming starts. */
export async function streamText(opts: CallOptions): Promise<AsyncIterable<string>> {
  const client = requireClient(opts.client ?? getOpenAI());
  const stream = await client.chat.completions.create(
    {
      model: aiModel(),
      messages: [{ role: "system", content: opts.system }, ...opts.messages],
      ...samplingParams(aiModel(), opts.maxTokens, opts.temperature ?? 0.7),
      stream: true,
    },
    { timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS },
  );
  return (async function* () {
    for await (const chunk of stream) {
      const t = chunk.choices[0]?.delta?.content;
      if (t) yield t;
    }
  })();
}

/** Zod -> JSON Schema for response_format (drops the $schema key OpenAI does not need). */
export function toOpenAiSchema(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  delete js.$schema;
  return js;
}

/**
 * Structured output: response_format json_schema + Zod validation, with one retry that tells
 * the model what was wrong. Throws AiOutputError after two invalid replies.
 */
export async function completeJson<T>(opts: CallOptions & { name: string; schema: z.ZodType<T> }): Promise<T> {
  const client = requireClient(opts.client ?? getOpenAI());
  const msgs: ChatMessage[] = [...opts.messages];
  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.chat.completions.create(
      {
        model: aiModel(),
        messages: [{ role: "system", content: opts.system }, ...msgs],
        ...samplingParams(aiModel(), opts.maxTokens, opts.temperature ?? 0.2),
        response_format: {
          type: "json_schema",
          json_schema: { name: opts.name, schema: toOpenAiSchema(opts.schema), strict: false },
        },
      },
      { timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS },
    );
    const text = res.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      lastProblem = "the reply was not valid JSON";
      msgs.push({ role: "assistant", content: text.slice(0, 4000) }, { role: "user", content: `Your reply was not valid JSON. Reply again with only JSON matching the schema.` });
      continue;
    }
    const r = opts.schema.safeParse(parsed);
    if (r.success) return r.data;
    lastProblem = r.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    msgs.push(
      { role: "assistant", content: text.slice(0, 4000) },
      { role: "user", content: `That JSON did not match the schema (${lastProblem}). Reply again with only corrected JSON.` },
    );
  }
  throw new AiOutputError(`Structured output "${opts.name}" invalid after retry: ${lastProblem}`);
}

/** Embeds texts (batched by the API). */
export async function embedTexts(texts: string[], client?: EmbedClient): Promise<number[][]> {
  const c = requireClient(client ?? getOpenAI());
  const res = await c.embeddings.create({ model: embedModel(), input: texts }, { timeout: DEFAULT_TIMEOUT_MS });
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
