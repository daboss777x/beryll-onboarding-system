import { describe, expect, it } from "vitest";
import { MAX_ERRORS_TO_PASS } from "@/content/walkthroughs/types";
import { buildResult, ERROR_PENALTY, scoreRun } from "./score";

const base = { walkthroughId: "wt-create-sow" as const, totalSteps: 10, durationMs: 61_234.4 };

describe("scoreRun", () => {
  it("is null for Watch", () => expect(scoreRun("watch", 10, 10, 0)).toBeNull());
  it("is 100 for a clean full run", () => expect(scoreRun("guided", 10, 10, 0)).toBe(100));
  it("loses ERROR_PENALTY per error", () => expect(scoreRun("solo", 10, 10, 2)).toBe(100 - 2 * ERROR_PENALTY));
  it("scales by steps done", () => expect(scoreRun("guided", 5, 10, 0)).toBe(50));
  it("clamps to 0-100", () => {
    expect(scoreRun("solo", 2, 10, 9)).toBe(0);
    expect(scoreRun("solo", 12, 10, 0)).toBe(100);
    expect(scoreRun("solo", 0, 0, 0)).toBe(0);
  });
});

describe("buildResult", () => {
  it("passes a complete run within the error limit", () => {
    const r = buildResult({ ...base, mode: "solo", stepsDone: 10, errors: MAX_ERRORS_TO_PASS });
    expect(r).toMatchObject({ passed: true, completed: true, stepsDone: 10, totalSteps: 10, durationMs: 61_234, score: 80 });
  });
  it("fails a complete run over the error limit", () => {
    expect(buildResult({ ...base, mode: "guided", stepsDone: 10, errors: MAX_ERRORS_TO_PASS + 1 }).passed).toBe(false);
  });
  it("never passes an incomplete run", () => {
    const r = buildResult({ ...base, mode: "guided", stepsDone: 4, errors: 0 });
    expect(r).toMatchObject({ passed: false, completed: false, score: 40 });
  });
  it("Watch runs pass when watched to the end and have no score", () => {
    expect(buildResult({ ...base, mode: "watch", stepsDone: 10, errors: 0 })).toMatchObject({ passed: true, score: null });
  });
  it("carries every WalkthroughRun field", () => {
    const r = buildResult({ ...base, mode: "solo", stepsDone: 10, errors: 0 });
    expect(Object.keys(r)).toEqual(expect.arrayContaining(["walkthroughId", "mode", "errors", "durationMs", "passed"]));
  });
});
