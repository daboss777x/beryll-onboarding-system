import { describe, expect, it } from "vitest";
import { certificationDecision, scoreQuiz, type QuizQuestion } from "./scoring";
import { computeCohortMetrics } from "./cohort";
import { TASKS, prog } from "./fixtures";
import type { Pulse } from "../types";

const qs: QuizQuestion[] = [
  { id: "s", type: "single", correct: "b" },
  { id: "m", type: "multi", correct: ["a", "c"] },
  { id: "o", type: "ordering", correct: ["1", "2", "3"] },
  { id: "w", type: "single", correct: "x", points: 2 },
];

describe("scoreQuiz", () => {
  it("scores everything right", () => {
    const r = scoreQuiz(qs, { s: "b", m: ["c", "a"], o: ["1", "2", "3"], w: "x" });
    expect(r).toMatchObject({ score: 100, correctCount: 4, total: 4, missedIds: [] });
  });
  it("handles wrong, missing, partial multi, wrong order and weights", () => {
    const r = scoreQuiz(qs, { s: "a", m: ["a"], o: ["1", "3", "2"] });
    expect(r.score).toBe(0);
    expect(r.missedIds).toEqual(["s", "m", "o", "w"]);
    expect(scoreQuiz(qs, { s: "b", m: ["a", "c", "c"], o: ["1", "2"], w: "x" }).score).toBe(80); // 4 of 5 points, ordering wrong
  });
  it("multi rejects extras; ordering needs full sequence", () => {
    expect(scoreQuiz([qs[1]], { m: ["a", "b", "c"] }).score).toBe(0);
    expect(scoreQuiz([qs[2]], { o: ["1", "2", "3", "4"] }).score).toBe(0);
  });
  it("empty quiz scores 0 without NaN", () => expect(scoreQuiz([], {}).score).toBe(0));
});

describe("certificationDecision", () => {
  const good = { scores: [{ criterion: "Discovery", score: 4 }, { criterion: "Close", score: 3 }] };
  it("passes at exactly 75 and all criteria >= 3", () => {
    const d = certificationDecision({ overall: 75, coaching: [] }, good);
    expect(d).toMatchObject({ decision: "passed", aiPassed: true, managerPassed: true, coaching: [] });
  });
  it("retests when AI is 74", () => {
    const d = certificationDecision({ overall: 74, coaching: ["Ask more questions"] }, good);
    expect(d.decision).toBe("retest");
    expect(d.coaching).toContain("Ask more questions");
    expect(d.coaching.length).toBe(2);
  });
  it("retests when one manager criterion is 2 even with a great AI score", () => {
    const d = certificationDecision({ overall: 95, coaching: [] }, { scores: [...good.scores, { criterion: "Objections", score: 2 }] });
    expect(d.decision).toBe("retest");
    expect(d.aiPassed).toBe(true);
    expect(d.managerPassed).toBe(false);
    expect(d.coaching.join(" ")).toContain("Objections");
  });
  it("retests, flagged as missing, without an observation", () => {
    for (const obs of [undefined, { scores: [] }]) {
      const d = certificationDecision({ overall: 90, coaching: [] }, obs);
      expect(d).toMatchObject({ decision: "retest", observationMissing: true });
    }
  });
  it("dedupes coaching lines", () => {
    expect(certificationDecision({ overall: 90, coaching: ["a", "a"] }, good).coaching).toEqual(["a"]);
  });
});

describe("computeCohortMetrics", () => {
  const pulse = (hireId: string, day: 7 | 30 | 90, c: number, f: number, b: number): Pulse => ({ hireId, day, clarity: c, confidence: f, belonging: b, submittedAt: "x" });
  const hires = [
    { hireId: "h1", programDay: 95, active: true, certifiedOnDay: 24 },
    { hireId: "h2", programDay: 91, active: false, certifiedOnDay: 30 },
    { hireId: "h3", programDay: 10, active: true },
  ];
  it("computes counts and averages", () => {
    const required = TASKS.filter((t) => t.required).length;
    const m = computeCohortMetrics({
      hires,
      tasks: TASKS,
      progress: [prog("pre-check"), prog("pre-check"), prog("d1-story"), { ...prog("w-quiz"), hireId: "h3" }, { ...prog("pre-check", "failed"), hireId: "h2" }],
      pulses: [pulse("h1", 7, 4, 4, 4), pulse("h1", 7, 2, 2, 2), pulse("h2", 7, 5, 3, 4)],
    });
    expect(m.timeToCertification).toEqual({ certifiedCount: 2, total: 3, averageDays: 27, fastestDays: 24, slowestDays: 30 });
    expect(m.processCompletion.perHire[0].percent).toBe(Math.round((2 / required) * 1000) / 10);
    expect(m.processCompletion.perHire[1].percent).toBe(0);
    expect(m.retention90).toEqual({ eligible: 2, retained: 1, label: "1 of 2" });
    // latest pulse per hire+day wins: h1 -> 2,2,2 ; h2 -> 5,3,4
    expect(m.averagePulse).toEqual({ clarity: 3.5, confidence: 2.5, belonging: 3, responses: 2 });
  });
  it("handles an empty cohort", () => {
    const m = computeCohortMetrics({ hires: [], tasks: TASKS, progress: [], pulses: [] });
    expect(m.timeToCertification.averageDays).toBeNull();
    expect(m.processCompletion.averagePercent).toBe(0);
    expect(m.retention90.label).toBe("0 of 0");
    expect(m.averagePulse).toEqual({ clarity: null, confidence: null, belonging: null, responses: 0 });
  });
});
