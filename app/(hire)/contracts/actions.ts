"use server";

import { revalidatePath } from "next/cache";
import { tasks } from "@/content";
import { getWalkthrough, walkthroughHref, type WalkthroughResult } from "@/content/walkthroughs";
import { recordTaskResult, type RewardResult } from "@/components/app/hire-state";
import { attemptCapMessage, countOnDay, DAILY_ATTEMPT_CAP, utcDayKey } from "@/components/labs/attempt-cap";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

const MODES = ["watch", "guided", "solo"] as const;
const clampInt = (n: unknown, min: number, max: number) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;
};

/**
 * Saves a walkthrough run and, when it counts, completes the matching roadmap task
 * (task href === walkthroughHref(id, mode)).
 * Counts = watch watched to the end, or guided/solo completed with ≤ 2 errors.
 * Pass/fail and score are recomputed here from steps and errors; the client's flags are ignored.
 * At most DAILY_ATTEMPT_CAP runs per walkthrough and mode are saved per UTC day (security L4).
 */
export async function saveWalkthroughResult(input: WalkthroughResult): Promise<RewardResult | { ok: true; saved: true; counted: false }> {
  const profile = await requireUser("hire");
  const wt = getWalkthrough(input?.walkthroughId);
  const mode = MODES.find((m) => m === input?.mode);
  if (!wt || !mode) return { ok: false, error: "Unknown walkthrough." };

  const totalSteps = wt.steps.length;
  const stepsDone = clampInt(input.stepsDone, 0, totalSteps);
  const errors = mode === "watch" ? 0 : clampInt(input.errors, 0, 999);
  const durationMs = clampInt(input.durationMs, 0, 6 * 60 * 60 * 1000);
  const completed = stepsDone >= totalSteps;
  const passed = completed && (mode === "watch" || errors <= 2);
  const score = mode === "watch" ? undefined : Math.max(0, Math.min(100, Math.round((100 * stepsDone) / totalSteps) - 10 * errors));

  const repo = await getRepo();
  const runsToday = countOnDay((await repo.listWalkthroughRuns(profile.id, wt.id)).filter((r) => r.mode === mode), utcDayKey());
  if (runsToday >= DAILY_ATTEMPT_CAP) return { ok: false, error: attemptCapMessage() };
  await repo.saveWalkthroughRun({ hireId: profile.id, walkthroughId: wt.id, mode, errors, durationMs, passed });

  const task = tasks.find((t) => t.href === walkthroughHref(wt.id, mode));
  if (!passed || !task) return { ok: true, saved: true, counted: false };

  const result = await recordTaskResult(repo, profile, task.id, { score, data: { walkthroughId: wt.id, mode, errors, durationMs } });
  revalidatePath("/today");
  revalidatePath("/roadmap");
  return result;
}
