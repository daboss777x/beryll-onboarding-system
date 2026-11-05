// Pure scoring for walkthrough runs. No React, unit-tested in score.test.ts.
import { MAX_ERRORS_TO_PASS, type WalkthroughMode, type WalkthroughResult } from "@/content/walkthroughs/types";

/** Points lost per wrong action (a mis-drop, a blocked move, a wrong click). */
export const ERROR_PENALTY = 10;

/**
 * Score = share of steps done (0-100) minus ERROR_PENALTY per error, clamped to 0-100.
 * Watch runs are demonstrations, so they have no score.
 */
export function scoreRun(mode: WalkthroughMode, stepsDone: number, totalSteps: number, errors: number): number | null {
  if (mode === "watch") return null;
  if (totalSteps <= 0) return 0;
  const done = Math.min(Math.max(stepsDone, 0), totalSteps);
  const raw = (100 * done) / totalSteps - ERROR_PENALTY * Math.max(errors, 0);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/** Builds the result object a run hands to onComplete. */
export function buildResult(input: { walkthroughId: WalkthroughResult["walkthroughId"]; mode: WalkthroughMode; stepsDone: number; totalSteps: number; errors: number; durationMs: number }): WalkthroughResult {
  const { walkthroughId, mode, stepsDone, totalSteps, errors, durationMs } = input;
  const completed = stepsDone >= totalSteps;
  return {
    walkthroughId,
    mode,
    errors,
    durationMs: Math.max(0, Math.round(durationMs)),
    passed: completed && (mode === "watch" || errors <= MAX_ERRORS_TO_PASS),
    stepsDone: Math.min(stepsDone, totalSteps),
    totalSteps,
    score: scoreRun(mode, stepsDone, totalSteps, errors),
    completed,
  };
}
