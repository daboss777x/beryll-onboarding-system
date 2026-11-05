import { describe, expect, it } from "vitest";
import { buildQuizFeedback, isReviewDue, newShadowLogItems, QUIZ_ATTEMPTS_PER_DAY, quizAttemptsToday, shouldRevealQuizAnswers } from "./quiz-rules";

const key = [
  { questionId: "q1", correct: ["a"], explanation: "Because a is the answer.", reviewModuleId: "m1" },
  { questionId: "q2", correct: ["b", "c"], explanation: "b and c." },
];

describe("quiz answer reveal", () => {
  it("reveals only on a pass or when the quiz is already done", () => {
    expect(shouldRevealQuizAnswers({ passed: false, alreadyDone: false })).toBe(false);
    expect(shouldRevealQuizAnswers({ passed: true, alreadyDone: false })).toBe(true);
    expect(shouldRevealQuizAnswers({ passed: false, alreadyDone: true })).toBe(true);
  });

  it("a failed attempt returns only correct/incorrect per question, never the key or explanations", () => {
    const fb = buildQuizFeedback(
      [
        { id: "q1", correct: false },
        { id: "q2", correct: true },
      ],
      key,
      false,
    );
    expect(fb).toEqual([
      { questionId: "q1", correct: false, reviewModuleId: "m1" },
      { questionId: "q2", correct: true },
    ]);
    const json = JSON.stringify(fb);
    expect(json).not.toContain("correctOptionIds");
    expect(json).not.toContain("explanation");
    expect(json).not.toContain("Because");
  });

  it("a blank attempt reveals nothing", () => {
    const fb = buildQuizFeedback(
      [
        { id: "q1", correct: false },
        { id: "q2", correct: false },
      ],
      key,
      false,
    );
    expect(fb.every((f) => f.correctOptionIds === undefined && f.explanation === undefined)).toBe(true);
  });

  it("a revealed attempt includes the key and explanations", () => {
    const fb = buildQuizFeedback([{ id: "q2", correct: false }], key, true);
    expect(fb[0]).toMatchObject({ questionId: "q2", correct: false, correctOptionIds: ["b", "c"], explanation: "b and c." });
  });
});

describe("quiz attempt cap", () => {
  it("counts only today's attempts (Dublin calendar day)", () => {
    const now = new Date("2026-11-05T12:00:00Z");
    const attempts = [{ at: "2026-11-05T09:00:00Z" }, { at: "2026-11-05T11:59:00Z" }, { at: "2026-11-04T12:00:00Z" }];
    expect(quizAttemptsToday(attempts, now)).toBe(2);
    expect(QUIZ_ATTEMPTS_PER_DAY).toBeGreaterThan(0);
  });
});

describe("spaced review due check", () => {
  it("is due on or after its due day only", () => {
    expect(isReviewDue({ dueDay: 5 }, 4)).toBe(false);
    expect(isReviewDue({ dueDay: 5 }, 5)).toBe(true);
    expect(isReviewDue({ dueDay: 5 }, 9)).toBe(true);
  });
});

describe("shadow-log dedupe", () => {
  const items = [
    { id: "a", title: "Discovery call" },
    { id: "b", title: "Renewal call" },
  ];
  it("skips items that already have a shadow-log row for the same interaction", () => {
    expect(newShadowLogItems(["a", "b"], items, [{ interaction: "Discovery call" }]).map((i) => i.id)).toEqual(["b"]);
  });
  it("tick, untick, re-tick creates no second row", () => {
    const logs: { interaction: string }[] = [];
    logs.push(...newShadowLogItems(["a"], items, logs).map((i) => ({ interaction: i.title })));
    expect(newShadowLogItems(["a"], items, logs)).toEqual([]);
  });
});
