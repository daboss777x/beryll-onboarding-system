import "server-only";

/** Small text helpers for fallback (no-model) scoring and retrieval. */

const STOP = new Set(
  (
    "a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those " +
    "i me my we our you your he she they them their his her what which who whom how why when where do does did done can could " +
    "should would will shall may might must have has had not no yes so than then there here about into over under also just " +
    "any some all each more most such very too only own same other up out off again once s t don isn aren wasn weren hasn " +
    "haven hadn doesn didn won wouldn shouldn couldn get got let us please tell know need want like"
  ).split(" "),
);

/** Very light English stemmer: enough to match "authorisation"/"authorise", "tests"/"testing". */
export function stem(w: string): string {
  let s = w.toLowerCase().replace(/z/g, "s"); // authorize -> authorise
  for (const suf of ["ations", "ation", "ating", "ated", "ates", "ate", "ingly", "ings", "ing", "ities", "ity", "ments", "ment", "ness", "ies", "ied", "ers", "er", "ed", "es", "s", "ly", "e"]) {
    if (s.length - suf.length >= 4 && s.endsWith(suf)) {
      s = s.slice(0, -suf.length);
      break;
    }
  }
  return s;
}

export function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9À-ɏ]+/g) ?? []).filter((w) => w.length > 1 && !STOP.has(w));
}

export function stems(text: string): string[] {
  return tokens(text).map(stem);
}

/** Share (0..1) of an idea's content words present in the text (stem match). */
export function ideaCoverage(idea: string, textStems: Set<string>): number {
  const want = [...new Set(stems(idea))];
  if (!want.length) return 0;
  return want.filter((w) => textStems.has(w)).length / want.length;
}

/** Sentences of a text (for quoting evidence). */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** The sentence of `text` sharing the most stems with `query` (or null when nothing overlaps). */
export function bestSentence(text: string, query: string | RegExp[]): string | null {
  let best: string | null = null;
  let bestScore = 0;
  const q = Array.isArray(query) ? null : new Set(stems(query));
  for (const s of sentences(text)) {
    const score = q ? stems(s).filter((w) => q.has(w)).length : (query as RegExp[]).filter((r) => r.test(s)).length;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export interface Bm25Doc {
  id: string;
  text: string;
}

/** BM25-lite over stems. Returns docs with score > 0, best first. */
export function bm25(query: string, docs: Bm25Doc[], k1 = 1.4, b = 0.75): { id: string; score: number; matched: number }[] {
  const q = [...new Set(stems(query))];
  if (!q.length || !docs.length) return [];
  const docStems = docs.map((d) => stems(d.text));
  const avg = docStems.reduce((n, s) => n + s.length, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const s of docStems) for (const w of new Set(s)) df.set(w, (df.get(w) ?? 0) + 1);
  const N = docs.length;
  return docs
    .map((d, i) => {
      const tf = new Map<string, number>();
      for (const w of docStems[i]) tf.set(w, (tf.get(w) ?? 0) + 1);
      let score = 0;
      let matched = 0;
      for (const w of q) {
        const f = tf.get(w);
        if (!f) continue;
        matched++;
        const n = df.get(w) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * docStems[i].length) / avg)));
      }
      return { id: d.id, score, matched };
    })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score);
}
