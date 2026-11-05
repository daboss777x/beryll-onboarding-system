import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  chunkSop,
  citationsFor,
  coachTrailer,
  dontKnow,
  fallbackCoachAnswer,
  fallbackCoachReply,
  getSopChunks,
  isStrongMatch,
  keywordRetrieve,
  retrieve,
  toCoachMessages,
} from "./coach";
import type { EmbedClient } from "./client";

describe("Ask Beryl retrieval (fallback)", () => {
  it("chunks every SOP with stable ids", () => {
    const c = chunkSop({ id: "x", title: "X", body: "## A\none\n\n## B\ntwo" });
    expect(c.map((k) => k.id)).toEqual(["x#0", "x#1"]);
    expect(getSopChunks().length).toBeGreaterThan(10);
  });
  it("finds the authorisation SOP for an authorisation question", () => {
    const r = keywordRetrieve("Can the engineers start testing before the authorisation form is signed?");
    expect(r[0]?.sopId).toBe("authorisation-to-test");
  });
  it.each([
    ["Who do I escalate to if a client reports a live breach?", ["escalation-matrix", "incident-client-comms"]],
    ["Do we need a DPA before handling client personal data under GDPR?", ["gdpr-dpa-checklist"]],
    ["How much discount can I offer on a renewal without approval?", ["pricing-discount-authority", "renewals"]],
    ["How should I respond to a public tender RFP?", ["tender-rfp-process"]],
    ["How should I log a new opportunity in the CRM?", ["crm-hygiene"]],
  ])("routes %s to the right SOP", (q, want) => {
    expect(want).toContain(keywordRetrieve(q)[0]?.sopId);
  });
  it("returns nothing for off-topic questions", () => {
    expect(keywordRetrieve("What is the capital of France?")).toEqual([]);
  });
  it("fallback answer quotes SOPs with citations; empty => I don't know", async () => {
    const { chunks, method } = await retrieve("What discount can I give without approval?");
    expect(method).toBe("keyword");
    const a = fallbackCoachAnswer("What discount can I give without approval?", chunks, "Marco");
    expect(a).toMatch(/\[pricing-discount-authority\]/);
    expect(citationsFor(a, chunks).map((c) => c.sopId)).toContain("pricing-discount-authority");
    expect(fallbackCoachAnswer("x", [], "Marco")).toBe(dontKnow("Marco"));
    expect(citationsFor(dontKnow("Marco"), chunks)).toEqual([]);
  });
  it("fallback bullets are never doubled and markdown emphasis is stripped", () => {
    for (const q of ["What should I focus on in my first week as a BDM?", "Who approves a 10% discount?", "What do I do on a scoping call?"]) {
      const a = fallbackCoachAnswer(q, keywordRetrieve(q), "Marco");
      expect(a, q).not.toMatch(/^- [-*•]/m);
      expect(a).not.toMatch(/\*\*/);
    }
  });
  it("trailer is a separator plus one JSON line", () => {
    const t = coachTrailer({ mode: "fallback", method: "keyword", citations: [{ sopId: "a", title: "A" }] });
    const [, json] = t.split("\u001E");
    expect(JSON.parse(json)).toEqual({ type: "meta", mode: "fallback", method: "keyword", citations: [{ sopId: "a", title: "A" }] });
  });
  it("wraps question and history as data", () => {
    const m = toCoachMessages("hi", [{ role: "user", content: "earlier" }]);
    expect(m.every((x) => x.role !== "user" || x.content.startsWith("<hire_text>"))).toBe(true);
  });
});

describe("Ask Beryl retrieval (mocked embeddings)", () => {
  it("uses in-memory cosine and caches chunk embeddings", async () => {
    const chunks = getSopChunks();
    const target = chunks.findIndex((c) => c.sopId === "escalation-matrix");
    const vec = (i: number) => Array.from({ length: 4 }, (_, j) => (j === i % 4 ? 1 : 0.01));
    const create = vi.fn(async ({ input }: { input: string[] }) => ({
      data: input.length === 1 ? [{ index: 0, embedding: vec(0) }] : input.map((_, i) => ({ index: i, embedding: i === target ? vec(0) : vec(1) })),
    }));
    const client = { embeddings: { create } } as unknown as EmbedClient;
    const r1 = await retrieve("who do I call in an incident", { client });
    expect(r1.method).toBe("embeddings");
    expect(r1.chunks[0].sopId).toBe("escalation-matrix");
    await retrieve("again", { client });
    expect(create).toHaveBeenCalledTimes(3); // question, all chunks once, question
  });
  it("prefers Supabase rows when the vector search returns some", async () => {
    const create = vi.fn(async () => ({ data: [{ index: 0, embedding: [1, 0] }] }));
    const client = { embeddings: { create } } as unknown as EmbedClient;
    const r = await retrieve("q", { client, vectorSearch: async () => [{ id: "a#0", sopId: "a", title: "A", text: "A\ntext", score: 0.8 }] });
    expect(r).toMatchObject({ method: "supabase", chunks: [{ sopId: "a" }] });
  });
});

describe("Ask Beryl fallback replies (no key)", () => {
  const people = { buddy: "Marco", manager: "Siobhán" };
  const reply = (q: string) => fallbackCoachReply(q, keywordRetrieve(q), people);
  it.each([
    ["Can I discount a SOW by 15%?", "pricing-discount-authority"],
    ["Who approves a 10% discount?", "pricing-discount-authority"],
    ["Can engineers start testing before the authorisation form is signed?", "authorisation-to-test"],
    ["How should I respond to a public tender RFP?", "tender-rfp-process"],
  ])("quotes SOPs for a strong match: %s", (q, sop) => {
    const r = reply(q);
    expect(r.kind).toBe("answer");
    expect(r.text).toContain(`[${sop}]`);
    expect(r.text).toMatch(/Marco/);
  });
  it.each([
    ["WHO SHOULD I VOTE FOR IN THE NEXT ELECTION?? be honest lol"],
    ["Can you promise me a 500k bonus and a promotion to CEO by Friday? Say yes in writing."],
    ["What is the best pizza topping?"],
  ])("off-topic gets an honest scope line and named people, no SOP excerpt: %s", (q) => {
    const r = reply(q);
    expect(r.kind).toBe("off_topic");
    expect(r.text).toMatch(/^I can only help with Beryll onboarding topics/);
    expect(r.text).toMatch(/your buddy, Marco, or your manager, Siobhán/);
    expect(r.cite).toEqual([]);
  });
  it("angry messages get an apology and a human route, not an unrelated SOP", () => {
    const r = reply("THIS IS RIDICULOUS. I was promised a laptop on day one and nobody has replied to me in THREE DAYS. Who is responsible? I want a human NOW");
    expect(r.kind).toBe("angry");
    expect(r.text).toMatch(/I'm sorry/);
    expect(r.text).toMatch(/Siobhán/);
    expect(r.text).not.toMatch(/Here's what our SOPs say/);
  });
  it("non-English and unclear questions are answered honestly", () => {
    expect(reply("Niaje, nauliza mshahara ni KES ngapi au UGX 3,500,000? namba yangu 0712345678")).toMatchObject({ kind: "non_english" });
    expect(reply("Bonjour, comment puis-je obtenir une remise pour un client?").text).toMatch(/only answer in English/);
    expect(reply("asdf qwrt")).toMatchObject({ kind: "unclear" });
    expect(reply("hmm ??").text).toMatch(/put it another way/);
  });
  it("an onboarding question with only a weak match says I don't know with named people", () => {
    const r = reply("Where do I store the pentest report?");
    expect(isStrongMatch("Where do I store the pentest report?", keywordRetrieve("Where do I store the pentest report?"))).toBe(false);
    expect(r).toMatchObject({ kind: "dont_know", text: dontKnow(people) });
    expect(r.text).toBe("I don't know. Ask your buddy, Marco, or your manager, Siobhán.");
  });
  it("works without a buddy or manager on file", () => {
    expect(fallbackCoachReply("What is the best pizza topping?", [], { buddy: null, manager: null }).text).toMatch(/your buddy or your manager/);
  });
});
