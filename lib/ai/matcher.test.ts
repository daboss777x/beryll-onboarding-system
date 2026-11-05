import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { staff } from "@/content/staff";
import { MATCHER_MAX_QUESTIONS, defaultVisibility, extractFallback, fallbackQuestion, matchStaff, normaliseInterests, templateSuggestion } from "./matcher";
import { matcherExtractSchema } from "./schemas";

const chat = [
  { role: "assistant" as const, content: "What do you like doing outside work?" },
  { role: "user" as const, content: "I play golf most Saturdays and I'm learning chess. Fun fact: I once ran a marathon." },
  { role: "assistant" as const, content: "How do you like to work?" },
  { role: "user" as const, content: "I like bouncing ideas off people over a coffee." },
];

describe("matcher fallback", () => {
  it("extracts interests, preferences and fun facts", () => {
    const x = extractFallback(chat);
    expect(matcherExtractSchema.parse(x)).toBeTruthy();
    expect(x.interests).toEqual(expect.arrayContaining(["golf", "chess", "running", "coffee"]));
    expect(x.preferences.availability).toMatch(/weekend/i);
    expect(x.funFacts[0]).toMatch(/marathon/);
  });
  it("matches 3 distinct colleagues by overlap, Enoch for golf+chess", () => {
    const picks = matchStaff(["golf", "chess"], staff);
    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((p) => p.staff.id)).size).toBe(3);
    expect(picks[0].staff.id).toBe("enoch-omunu");
    const s = templateSuggestion(picks[0]);
    expect(s.reason).toMatch(/golf/);
    expect(s.icebreaker).toMatch(/Enoch/);
  });
  it("still suggests 3 people with no overlap, buddy first", () => {
    const picks = matchStaff(["knitting"], staff, { buddyStaffId: "marco-rossi" });
    expect(picks).toHaveLength(3);
    expect(picks[0].staff.id).toBe("marco-rossi");
    expect(templateSuggestion(picks[0]).reason).toContain("Marco");
  });
  it("normalises synonyms and defaults visibility off", () => {
    expect(normaliseInterests(["Parkrun", "soccer", "Knitting"])).toEqual(["running", "football", "knitting"]);
    expect(Object.values(defaultVisibility(["golf"])).every((v) => v === false)).toBe(true);
  });
  it("interview asks one question at a time, honours skip, and stops at the max", () => {
    expect(fallbackQuestion([])).toMatch(/\?$/);
    expect(fallbackQuestion([...chat.slice(0, 1), { role: "user", content: "skip" }])).toMatch(/^No problem/);
    const long = Array.from({ length: MATCHER_MAX_QUESTIONS }, () => [{ role: "assistant" as const, content: "q?" }, { role: "user" as const, content: "a" }]).flat();
    expect(fallbackQuestion(long)).toMatch(/Finish/);
  });
});
