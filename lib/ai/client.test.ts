import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { z } from "zod";
import { AiOutputError, completeJson, streamText, toOpenAiSchema, type ChatClient } from "./client";
import { labGradeSchema, matcherExtractSchema, roleplayGraderSchema } from "./schemas";

function fakeClient(replies: string[]) {
  const create = vi.fn(async () => ({ choices: [{ message: { content: replies.shift() ?? "" } }] }));
  return { client: { chat: { completions: { create } } } as unknown as ChatClient, create };
}

const schema = z.object({ score: z.number().min(0).max(100), tips: z.array(z.string()) });

describe("completeJson", () => {
  it("returns validated JSON and sends json_schema + max tokens", async () => {
    const { client, create } = fakeClient([JSON.stringify({ score: 80, tips: ["a"] })]);
    const out = await completeJson({ name: "t", schema, system: "sys", messages: [{ role: "user", content: "x" }], maxTokens: 123, client });
    expect(out).toEqual({ score: 80, tips: ["a"] });
    const [params, opts] = create.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>];
    expect(params.max_completion_tokens).toBe(123);
    expect((params.response_format as { type: string }).type).toBe("json_schema");
    expect(opts.timeout).toBeGreaterThan(0);
  });
  it("retries once with feedback after invalid output", async () => {
    const { client, create } = fakeClient(["not json", JSON.stringify({ score: 50, tips: [] })]);
    const out = await completeJson({ name: "t", schema, system: "s", messages: [{ role: "user", content: "x" }], maxTokens: 50, client });
    expect(out.score).toBe(50);
    expect(create).toHaveBeenCalledTimes(2);
    const retryMsgs = (create.mock.calls[1] as unknown as [{ messages: { content: string }[] }])[0].messages;
    expect(retryMsgs[retryMsgs.length - 1].content).toMatch(/not valid JSON/);
  });
  it("throws AiOutputError after two schema failures", async () => {
    const { client } = fakeClient([JSON.stringify({ score: 500 }), JSON.stringify({ score: "x" })]);
    await expect(completeJson({ name: "t", schema, system: "s", messages: [], maxTokens: 50, client })).rejects.toBeInstanceOf(AiOutputError);
  });
});

describe("streamText", () => {
  it("yields delta content", async () => {
    const chunks = [{ choices: [{ delta: { content: "Hel" } }] }, { choices: [{ delta: {} }] }, { choices: [{ delta: { content: "lo" } }] }];
    const create = vi.fn(async () => (async function* () { yield* chunks; })());
    const client = { chat: { completions: { create } } } as unknown as ChatClient;
    let s = "";
    for await (const c of await streamText({ system: "s", messages: [], maxTokens: 10, client })) s += c;
    expect(s).toBe("Hello");
    expect((create.mock.calls[0] as unknown as [{ stream: boolean }])[0].stream).toBe(true);
  });
});

describe("output schemas convert to JSON Schema", () => {
  it.each([["grader", roleplayGraderSchema], ["lab", labGradeSchema], ["matcher", matcherExtractSchema]] as const)("%s", (_n, s) => {
    const js = toOpenAiSchema(s);
    expect(js.type).toBe("object");
    expect(js.$schema).toBeUndefined();
  });
});

describe("output schemas reject bad model JSON", () => {
  it("grader: out-of-range or fractional scores, unknown criteria, missing summary", () => {
    const ok = { scores: [{ criterion: "accuracy", score: 4, evidence: "q" }], summary: "s", coaching: [] };
    expect(roleplayGraderSchema.safeParse(ok).success).toBe(true);
    expect(roleplayGraderSchema.safeParse({ ...ok, scores: [{ criterion: "accuracy", score: 6, evidence: "q" }] }).success).toBe(false);
    expect(roleplayGraderSchema.safeParse({ ...ok, scores: [{ criterion: "accuracy", score: 3.5, evidence: "q" }] }).success).toBe(false);
    expect(roleplayGraderSchema.safeParse({ ...ok, scores: [{ criterion: "charisma", score: 3, evidence: "q" }] }).success).toBe(false);
    expect(roleplayGraderSchema.safeParse({ ...ok, scores: [] }).success).toBe(false);
    expect(roleplayGraderSchema.safeParse({ scores: ok.scores, coaching: [] }).success).toBe(false);
  });
  it("lab grade: score must be 0-100 and the model excerpt is length-capped", () => {
    const ok = { score: 70, strengths: [], gaps: [], modelAnswerExcerpt: "x" };
    expect(labGradeSchema.safeParse(ok).success).toBe(true);
    expect(labGradeSchema.safeParse({ ...ok, score: 140 }).success).toBe(false);
    expect(labGradeSchema.safeParse({ ...ok, modelAnswerExcerpt: "x".repeat(601) }).success).toBe(false);
  });
  it("matcher extract: rejects missing preferences and over-long lists", () => {
    const ok = { interests: ["golf"], preferences: { workingStyle: "", socialStyle: "", availability: "" }, funFacts: [] };
    expect(matcherExtractSchema.safeParse(ok).success).toBe(true);
    expect(matcherExtractSchema.safeParse({ ...ok, preferences: undefined }).success).toBe(false);
    expect(matcherExtractSchema.safeParse({ ...ok, interests: Array(13).fill("x") }).success).toBe(false);
  });
});
