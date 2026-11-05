import "server-only";
import type { Sop } from "@/content/schema";
import { embedTexts, isLive, markAiFailure, type ChatMessage, type EmbedClient } from "./client";
import { getSops } from "./content";
import { SECURITY_RULES, wrapUserData } from "./guard";
import { classifyMessage, mentionsOnboarding } from "./intent";
import { bm25, cosine, sentences, stem, stems, tokens, truncate } from "./text";

export interface SopChunk {
  id: string; // `${sopId}#${n}`
  sopId: string;
  title: string;
  text: string;
}
export type ScoredChunk = SopChunk & { score: number };
export type RetrievalMethod = "supabase" | "embeddings" | "keyword";
export interface Citation {
  sopId: string;
  title: string;
}

export const TOP_K = 5;
export const MIN_COSINE = 0.3;
export const MIN_BM25 = 1.2;
export const TITLE_WEIGHT = 2;

/**
 * Splits an SOP into heading sections (## ...), then paragraphs up to ~maxChars.
 * Keep in sync with chunkSop() in scripts/embed-sops.ts (that script cannot import server-only code).
 */
export function chunkSop(sop: Pick<Sop, "id" | "title" | "body">, maxChars = 900): SopChunk[] {
  const sections = sop.body.split(/\n(?=#{1,3} )/).map((s) => s.trim()).filter(Boolean);
  const pieces: string[] = [];
  for (const sec of sections) {
    if (sec.length <= maxChars) {
      pieces.push(sec);
      continue;
    }
    let buf = "";
    for (const para of sec.split(/\n{2,}/)) {
      if (buf && buf.length + para.length > maxChars) {
        pieces.push(buf);
        buf = "";
      }
      buf = buf ? `${buf}\n\n${para}` : para;
    }
    if (buf) pieces.push(buf);
  }
  return pieces.map((p, n) => ({ id: `${sop.id}#${n}`, sopId: sop.id, title: sop.title, text: `${sop.title}\n${p}` }));
}

let chunkCache: SopChunk[] | null = null;
export function getSopChunks(): SopChunk[] {
  chunkCache ??= getSops().flatMap((s) => chunkSop(s));
  return chunkCache;
}

// ------------------------------------------------------------------ retrieval

/** Words that appear in many SOPs and say nothing about the topic. */
const GENERIC = new Set(stems("client clients beryll bdm sop process do does should what how when who"));

export function keywordRetrieve(question: string, chunks: SopChunk[] = getSopChunks()): ScoredChunk[] {
  // Filter raw tokens (not stems): bm25() stems its query itself, and stemming twice
  // mangles words ("authorisation" -> "authoris" -> "authori") so they no longer match.
  const q = tokens(question).filter((w) => !GENERIC.has(stem(w))).join(" ");
  if (!q) return [];
  const byId = new Map(chunks.map((c) => [c.id, c]));
  // Title boost: chunks are small heading sections, so a one-line "Do not" bullet in an unrelated
  // SOP can out-score the SOP that is actually about the topic. A query word in the SOP title is
  // the strongest topical signal, so each one adds TITLE_WEIGHT x its (chunk-level) idf.
  const qStems = [...new Set(stems(q))];
  const df = new Map<string, number>();
  for (const c of chunks) for (const w of new Set(stems(c.text))) df.set(w, (df.get(w) ?? 0) + 1);
  const idf = (w: string) => Math.log(1 + (chunks.length - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
  const titleBoost = new Map<string, number>();
  const boostFor = (title: string) => {
    if (!titleBoost.has(title)) {
      const t = new Set(stems(title));
      titleBoost.set(title, qStems.filter((w) => t.has(w)).reduce((n, w) => n + TITLE_WEIGHT * idf(w), 0));
    }
    return titleBoost.get(title)!;
  };
  return bm25(q, chunks)
    .filter((r) => r.score >= MIN_BM25)
    .map((r) => {
      const c = byId.get(r.id)!;
      return { ...c, score: r.score + boostFor(c.title) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

let embedCache: Promise<number[][]> | null = null;

async function inMemoryVectorRetrieve(qv: number[], client?: EmbedClient): Promise<ScoredChunk[]> {
  const chunks = getSopChunks();
  embedCache ??= embedTexts(chunks.map((c) => c.text), client).catch((e) => {
    embedCache = null; // retry next time
    throw e;
  });
  const vecs = await embedCache;
  return chunks
    .map((c, i) => ({ ...c, score: cosine(qv, vecs[i]) }))
    .filter((c) => c.score >= MIN_COSINE)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

export type VectorSearch = (embedding: number[], k: number) => Promise<ScoredChunk[] | null>;

/**
 * Live: embed the question, then Supabase match_sop_chunks (when `vectorSearch` is given and
 * returns rows), else in-memory cosine over lazily embedded chunks. Any failure: keyword BM25.
 */
export async function retrieve(question: string, opts: { vectorSearch?: VectorSearch; client?: EmbedClient } = {}): Promise<{ chunks: ScoredChunk[]; method: RetrievalMethod }> {
  if (isLive() || opts.client) {
    try {
      const [qv] = await embedTexts([question], opts.client);
      if (opts.vectorSearch) {
        const rows = await opts.vectorSearch(qv, TOP_K).catch((e) => {
          console.warn(`[ai] sop vector search failed, using in-memory: ${e instanceof Error ? e.message : "unknown"}`);
          return null;
        });
        if (rows && rows.length) return { chunks: rows.filter((r) => r.score >= MIN_COSINE), method: "supabase" };
      }
      return { chunks: await inMemoryVectorRetrieve(qv, opts.client), method: "embeddings" };
    } catch (e) {
      markAiFailure(e, "coach retrieval");
    }
  }
  return { chunks: keywordRetrieve(question), method: "keyword" };
}

// ------------------------------------------------------------------ answers

/** The people a hire can ask, by first name (null when the data has no such person). */
export interface HumanContacts {
  buddy: string | null;
  manager: string | null;
}

/** "your buddy, Marco, or your manager, Siobhán" (whichever exist). */
export function humanRoute(c: HumanContacts): string {
  const parts = [c.buddy ? `your buddy, ${c.buddy}` : null, c.manager ? `your manager, ${c.manager}` : null].filter(Boolean);
  return parts.length ? parts.join(", or ") : "your buddy or your manager";
}

const contactsOf = (c: HumanContacts | string): HumanContacts => (typeof c === "string" ? { buddy: c, manager: null } : c);

/** Exact "don't know" line (the live prompt asks the model to reply with it verbatim). */
export const dontKnow = (who: HumanContacts | string) => `I don't know. Ask ${humanRoute(contactsOf(who))}.`;
export const COACH_REFUSAL = "I can't share that. I can only answer questions using Beryll's SOPs. What would you like to know about how we work?";

export const offTopicAnswer = (c: HumanContacts) =>
  `I can only help with Beryll onboarding topics, like our SOPs, clients, contracts and your first 90 days. For anything else, ${humanRoute(c)} is the best person to ask.`;
export const unclearAnswer = (c: HumanContacts) =>
  `I'm not sure what you're asking. Could you put it another way? For example: "Who signs the authorisation form?" or "What discount can I offer without approval?" You can also ask ${humanRoute(c)}.`;
export const nonEnglishAnswer = (c: HumanContacts) =>
  `Sorry, I can only answer in English, and only about Beryll onboarding topics. Please try your question in English, or ask ${humanRoute(c)}, who can help you directly.`;
export const angryAnswer = (c: HumanContacts) =>
  `I'm sorry this has been frustrating. I'm an automated onboarding helper, so I can't sort this out myself, but people can: please message ${humanRoute(c)} and tell them what's happened. For kit, access or anything that's blocking your work, your manager is the quickest route.`;

export function uniqueCitations(chunks: SopChunk[]): Citation[] {
  const seen = new Map<string, Citation>();
  for (const c of chunks) if (!seen.has(c.sopId)) seen.set(c.sopId, { sopId: c.sopId, title: c.title });
  return [...seen.values()];
}

/** Citations for the final answer: SOPs the answer cites as [sop-id], else all retrieved; none for "I don't know". */
export function citationsFor(answer: string, chunks: SopChunk[]): Citation[] {
  if (/^\s*I don't know\./.test(answer)) return [];
  const all = uniqueCitations(chunks);
  const cited = all.filter((c) => answer.includes(`[${c.sopId}]`));
  return cited.length ? cited : all;
}

export function buildCoachPrompt(chunks: SopChunk[], who: HumanContacts | string): string {
  const excerpts = chunks.map((c) => `[${c.sopId}] ${c.text}`).join("\n\n---\n\n");
  return [
    "You are Beryl, the onboarding coach at Beryll Cyber Security (Dublin). You help a new Business Development Manager follow company SOPs.",
    "Answer ONLY from the SOP excerpts below. Be brief (2-6 sentences or a short list), practical and friendly. After each point, cite the SOP id in square brackets, e.g. [sop-escalation-matrix].",
    `If the excerpts do not answer the question, reply exactly: "${dontKnow(who)}" and nothing else. Never invent policy, prices, names or dates.`,
    `SOP excerpts:\n${excerpts}`,
    SECURITY_RULES,
  ].join("\n\n");
}

export function toCoachMessages(question: string, history: ChatMessage[] = []): ChatMessage[] {
  const prior = history.slice(-8).map((m) => (m.role === "user" ? { role: "user" as const, content: wrapUserData(m.content) } : m));
  return [...prior, { role: "user", content: wrapUserData(question) }];
}

/** Keyword (BM25 + title) score the top chunk must reach before the fallback quotes SOPs. */
export const STRONG_SCORE = 4;
/** Share of the question's topical words the top chunk must contain. */
export const STRONG_COVERAGE = 0.5;

/** Topical stems of a question (generic words like "client" or "process" removed). */
const topicalStems = (question: string) => [...new Set(tokens(question).filter((w) => !GENERIC.has(stem(w))).map(stem))];

/**
 * Is the best keyword match good enough to quote? Embedding/Supabase matches already passed
 * MIN_COSINE, so only keyword matches are checked: a high score AND most of the question's
 * topical words in the chunk (stops "WHO SHOULD I VOTE FOR" matching a tone SOP on "should").
 */
export function isStrongMatch(question: string, chunks: ScoredChunk[], method: RetrievalMethod = "keyword"): boolean {
  const top = chunks[0];
  if (!top) return false;
  if (method !== "keyword") return true;
  const want = topicalStems(question);
  if (!want.length) return false;
  // Coverage is checked against the whole SOP the top chunk comes from (chunks are small sections).
  const sop = getSops().find((x) => x.id === top.sopId);
  const have = new Set(stems(sop ? `${sop.title}\n${sop.body}` : top.text));
  const coverage = want.filter((w) => have.has(w)).length / want.length;
  return top.score >= STRONG_SCORE && coverage >= STRONG_COVERAGE;
}

/** A sentence without markdown list markers or emphasis, so we can add our own bullet once. */
const cleanSentence = (s: string) =>
  s
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")
    .replace(/\*\*|__/g, "")
    .trim();

/** Fallback answer: the most relevant sentences from the top SOP chunks, with titles. */
export function fallbackCoachAnswer(question: string, chunks: ScoredChunk[], who: HumanContacts | string): string {
  const c = contactsOf(who);
  if (!chunks.length) return dontKnow(c);
  const q = new Set(stems(question));
  const parts = chunks.slice(0, 2).map((ch) => {
    const body = ch.text.slice(ch.title.length).replace(/^#+\s.*$/gm, "");
    const ranked = sentences(body)
      .map(cleanSentence)
      .filter((s) => s.length > 2)
      .map((s, i) => ({ s, i, n: stems(s).filter((w) => q.has(w)).length }))
      .sort((a, b) => b.n - a.n || a.i - b.i)
      .slice(0, 2)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.s);
    return `${truncate(ranked.join(" "), 400)} [${ch.sopId}]`;
  });
  return `Here's what our SOPs say:\n\n${parts.map((p) => `- ${p}`).join("\n")}\n\nIf that doesn't cover it, ask ${humanRoute(c)}.`;
}

export type FallbackKind = "answer" | "dont_know" | "off_topic" | "unclear" | "non_english" | "angry";

/**
 * The whole no-model reply: honest about what it can't do, a named human route every time,
 * and SOP excerpts only when the keyword match is strong.
 */
export function fallbackCoachReply(question: string, chunks: ScoredChunk[], contacts: HumanContacts, method: RetrievalMethod = "keyword"): { text: string; kind: FallbackKind; cite: ScoredChunk[] } {
  const intent = classifyMessage(question);
  const strong = isStrongMatch(question, chunks, method);
  if (intent === "non_english") return { text: nonEnglishAnswer(contacts), kind: "non_english", cite: [] };
  if (intent === "unclear") return { text: unclearAnswer(contacts), kind: "unclear", cite: [] };
  if (intent === "angry") {
    if (!strong) return { text: angryAnswer(contacts), kind: "angry", cite: [] };
    const answer = fallbackCoachAnswer(question, chunks, contacts);
    return { text: `${angryAnswer(contacts)}\n\n${answer}`, kind: "angry", cite: chunks.slice(0, 2) };
  }
  if (strong) return { text: fallbackCoachAnswer(question, chunks, contacts), kind: "answer", cite: chunks.slice(0, 2) };
  if (mentionsOnboarding(question)) return { text: dontKnow(contacts), kind: "dont_know", cite: [] };
  return { text: offTopicAnswer(contacts), kind: "off_topic", cite: [] };
}

/** Wire format: answer text, then "\n\u001E" + one JSON line + "\n". */
export const COACH_META_SEPARATOR = "\u001E";
export function coachTrailer(meta: { mode: "live" | "fallback"; method: RetrievalMethod; citations: Citation[] }): string {
  return `\n${COACH_META_SEPARATOR}${JSON.stringify({ type: "meta", ...meta })}\n`;
}
