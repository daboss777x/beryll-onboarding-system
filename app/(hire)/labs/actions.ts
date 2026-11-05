"use server";

import { revalidatePath } from "next/cache";
import { dataHandlingDrills, phishingEmail, redlineContracts, signatureStory, sopById, translatorDrills } from "@/content";
import { drillKeys, phishingKey } from "@/content/server";
import { loadHireState, recordTaskResult, type HireState, type RewardResult } from "@/components/app/hire-state";
import { attemptCapMessage, takeAttempt, utcDayKey, type AttemptCounter } from "@/components/labs/attempt-cap";
import { combinedLabScore, evaluateStoryPath, PHISH_ACTIONS, phishingView, redlineNote, scoreDrillAnswers, scorePhishing, withBestScore } from "@/components/labs/scoring";
import type { DrillCheckResult, DrillSubmitResult, GradeActionResult, LabError, PhishSubmitResult, StorySubmitResult } from "@/components/labs/types";
import { getRepo, type Repository } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import type { Profile, TaskDef } from "@/lib/types";
import { gradeOnServer, phishingHotspotFlags, taskForLab, TRANSLATOR_MIN_ITEMS, type LabId } from "./server";

const REDLINE_IDS = redlineContracts.map((c) => c.id);
const TRANSLATOR_IDS = [...translatorDrills.findings.map((f) => f.id), ...translatorDrills.asks.map((a) => a.id)];

interface LabCtx {
  profile: Profile;
  repo: Repository;
  state: HireState;
  task: TaskDef;
  done: boolean;
}

// requireUser runs outside any try/catch so its redirect is never swallowed.
async function labContext(labId: LabId): Promise<LabCtx | LabError> {
  const profile = await requireUser("hire");
  const task = taskForLab(labId);
  if (!task) return { ok: false, error: "This lab is not on your roadmap.", code: "not_found" };
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const status = state.taskStatuses[task.id];
  if (status === "locked") return { ok: false, error: "This lab is still locked.", code: "locked" };
  return { profile, repo, state, task, done: status === "done" };
}

const isErr = (x: LabCtx | LabError): x is LabError => "ok" in x;

const dataOf = (ctx: LabCtx) => ctx.state.progress.find((p) => p.taskId === ctx.task.id)?.data ?? {};

/** Saves partial work without changing a finished task. */
async function saveInProgress(ctx: LabCtx, patch: Record<string, unknown>) {
  if (ctx.done) return;
  const prev = ctx.state.progress.find((p) => p.taskId === ctx.task.id);
  await ctx.repo.upsertTaskProgress({
    hireId: ctx.profile.id,
    taskId: ctx.task.id,
    status: prev?.status === "failed" ? "failed" : "in_progress",
    score: prev?.score,
    attempts: prev?.attempts ?? 0,
    data: { ...(prev?.data ?? {}), ...patch },
  });
}

/**
 * Daily write cap per task (security L4). Only attempts that write count: practice on a finished task
 * writes nothing and is not capped. The returned counter is stored with the attempt's own write.
 */
function takeLabAttempt(ctx: LabCtx): { attemptsToday: AttemptCounter } | LabError {
  const t = takeAttempt(dataOf(ctx).attemptsToday, utcDayKey());
  return t.ok ? { attemptsToday: t.next } : { ok: false, error: attemptCapMessage(), code: "rate_limited" };
}

const numRecord = (v: unknown): Record<string, number> =>
  v && typeof v === "object" ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, n]) => typeof n === "number")) as Record<string, number> : {};

// ---------------------------------------------------------------- graded labs (redline, translator)

async function gradeMultiItem(
  labId: "redline-lab" | "translator-drills",
  itemId: string,
  answer: unknown,
  itemIds: string[],
  minItems: number,
): Promise<GradeActionResult> {
  const ctx = await labContext(labId);
  if (isErr(ctx)) return ctx;
  if (!itemIds.includes(itemId)) return { ok: false, error: "Unknown item.", code: "not_found" };
  const cap = ctx.done ? null : takeLabAttempt(ctx);
  if (cap && "ok" in cap) return cap;
  const g = await gradeOnServer(ctx.repo, ctx.profile.id, labId, itemId, answer);
  if (!g.ok) return g;

  const best = withBestScore(numRecord(dataOf(ctx).best), itemId, g.grade.score);
  const labScore = combinedLabScore(best, itemIds, minItems);
  let reward = null;
  if (ctx.done) {
    // Practice after finishing: show feedback, keep the recorded result.
  } else if (labScore !== null) {
    reward = await recordTaskResult(ctx.repo, ctx.profile, ctx.task.id, { score: labScore, data: { best, ...cap } });
  } else {
    await saveInProgress(ctx, { best, ...cap });
    revalidatePath(`/labs/${labId}`);
  }
  return { ok: true, grade: g.grade, best, labScore, reward };
}

export async function gradeRedline(
  contractId: string,
  rawFlags: { clauseId: string; category?: string; note?: string; escalate?: boolean }[],
): Promise<GradeActionResult> {
  const contract = redlineContracts.find((c) => c.id === contractId);
  if (!contract) {
    await requireUser("hire");
    return { ok: false, error: "Unknown contract.", code: "not_found" };
  }
  const clauseIds = new Set(contract.clauses.map((c) => c.id));
  const seen = new Set<string>();
  const flags = (Array.isArray(rawFlags) ? rawFlags : [])
    .filter((f) => f && typeof f.clauseId === "string" && clauseIds.has(f.clauseId) && !seen.has(f.clauseId) && seen.add(f.clauseId))
    .slice(0, 20)
    .map((f) => ({
      clauseId: f.clauseId,
      category: typeof f.category === "string" && f.category ? f.category.slice(0, 40) : undefined,
      note: redlineNote(typeof f.note === "string" ? f.note : "", f.escalate === true),
    }));
  return gradeMultiItem("redline-lab", contractId, { flags }, REDLINE_IDS, REDLINE_IDS.length);
}

export async function gradeTranslator(itemId: string, answer: string): Promise<GradeActionResult> {
  return gradeMultiItem("translator-drills", String(itemId), typeof answer === "string" ? answer : "", TRANSLATOR_IDS, TRANSLATOR_MIN_ITEMS);
}

// ---------------------------------------------------------------- data-handling drills

const drillAnswersOf = (ctx: LabCtx): Record<string, string> => {
  const raw = dataOf(ctx).drillAnswers;
  return raw && typeof raw === "object" ? Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([, v]) => typeof v === "string")) as Record<string, string> : {};
};

/** Instant feedback for one drill. The first answer per drill is kept on the server and is what gets scored. */
export async function checkDrill(drillId: string, optionId: string): Promise<DrillCheckResult> {
  const ctx = await labContext("data-handling-drills");
  if (isErr(ctx)) return ctx;
  const drill = dataHandlingDrills.find((d) => d.id === drillId);
  const key = drillKeys.find((k) => k.drillId === drillId);
  if (!drill || !key || !drill.options.some((o) => o.id === optionId)) return { ok: false, error: "Unknown drill or option.", code: "bad_request" };

  const answers = drillAnswersOf(ctx);
  const chosen = ctx.done ? optionId : (answers[drillId] ?? optionId);
  if (!ctx.done && !(drillId in answers)) await saveInProgress(ctx, { drillAnswers: { ...answers, [drillId]: optionId } });
  return {
    ok: true,
    drillId,
    chosenOptionId: chosen,
    correct: chosen === key.correctOptionId,
    correctOptionId: key.correctOptionId,
    explanation: key.explanation,
    sopTitle: sopById(key.sopId)?.title,
  };
}

export async function submitDrills(): Promise<DrillSubmitResult> {
  const ctx = await labContext("data-handling-drills");
  if (isErr(ctx)) return ctx;
  const answers = drillAnswersOf(ctx);
  const keys = drillKeys.filter((k) => dataHandlingDrills.some((d) => d.id === k.drillId));
  const r = scoreDrillAnswers(answers, keys);
  if (!ctx.done && r.unansweredIds.length) return { ok: false, error: `Answer all ${r.total} drills first (${r.unansweredIds.length} to go).`, code: "bad_request" };
  const passScore = ctx.task.passScore ?? 0;
  const cap = ctx.done ? null : takeLabAttempt(ctx);
  if (cap && "ok" in cap) return cap;
  // A new attempt starts clean: the answers move to lastDrillAnswers, and the page reshuffles the
  // options (seeded by the attempt count) so the next attempt can't replay this one's revealed positions.
  const reward = await recordTaskResult(ctx.repo, ctx.profile, ctx.task.id, { score: r.score, data: { drillAnswers: {}, lastDrillAnswers: answers, ...cap } });
  return { ok: true, score: r.score, correct: r.correct, total: r.total, passScore, passed: r.score >= passScore, reward };
}

// ---------------------------------------------------------------- signature story

export async function submitSignatureStory(choiceIds: string[]): Promise<StorySubmitResult> {
  const ctx = await labContext("signature-story");
  if (isErr(ctx)) return ctx;
  const path = Array.isArray(choiceIds) ? choiceIds.filter((c) => typeof c === "string").slice(0, 50) : [];
  const r = evaluateStoryPath(signatureStory, path);
  if (!r.valid || !r.endingKind) return { ok: false, error: "That path does not match the story. Play it through from the start.", code: "bad_request" };
  const cap = ctx.done ? null : takeLabAttempt(ctx);
  if (cap && "ok" in cap) return cap;
  const reward = await recordTaskResult(ctx.repo, ctx.profile, ctx.task.id, { score: r.score, data: { ending: r.endingKind, path: r.nodeIds, ...cap } });
  return { ok: true, endingKind: r.endingKind, passed: r.score === 100, reward };
}

// ---------------------------------------------------------------- phishing simulation

export async function submitPhishing(hotspots: string[], action: string): Promise<PhishSubmitResult> {
  const ctx = await labContext("phishing-sim");
  if (isErr(ctx)) return ctx;
  if (!(PHISH_ACTIONS as readonly string[]).includes(action)) return { ok: false, error: "Choose what you would do with this email.", code: "bad_request" };
  const map = phishingHotspotFlags(phishingEmail);
  const picked = (Array.isArray(hotspots) ? hotspots : []).filter((h) => typeof h === "string" && h in map).slice(0, 40);
  const allIds = phishingKey.redFlags.map((f) => f.id);
  const r = scorePhishing({ hotspots: picked, action }, map, allIds);
  const cap = ctx.done ? null : takeLabAttempt(ctx);
  if (cap && "ok" in cap) return cap;
  // Only the right action (report it) completes the task; anything else is a teaching moment and a retry.
  // A wrong action still counts towards the daily cap, so the counts can't be probed without limit.
  let reward: RewardResult | null = null;
  if (ctx.done) {
    // Practice after finishing: nothing is written.
  } else if (r.actionCorrect) {
    reward = await recordTaskResult(ctx.repo, ctx.profile, ctx.task.id, { score: r.score, data: { hotspots: picked, action, ...cap } });
  } else {
    await saveInProgress(ctx, { ...cap });
  }
  const passed = !!reward && reward.ok && reward.passed;
  // Security M1: the flags and the correct action are revealed only on a pass or once the task is done.
  return { ok: true, ...phishingView(r, phishingKey, { passed, taskDone: ctx.done }), reward };
}
