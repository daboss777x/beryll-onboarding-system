import "server-only";
import { revalidatePath } from "next/cache";
import { stages, tasks } from "@/content";
import type { Repository } from "@/lib/data";
import type { Certification, Quest, StageStatus } from "@/lib/data/types";
import {
  computeStageStatuses,
  computeTaskStatuses,
  currentStreak,
  didPass,
  evaluateTrophies,
  getProgramDay,
  isCertificationPassed,
  levelFromXp,
  rankFor,
  riskFlags,
  TROPHY_DEFS,
  totalXp,
  xpForTask,
  type LevelInfo,
} from "@/lib/logic";
import type { Profile, RankId, RiskFlag, StageId, TaskDef, TaskProgress, TaskStatus, XpEvent } from "@/lib/types";

/**
 * One place that turns repository rows into the hire's journey state.
 * Used by every hire screen, the manager views and the buddy view.
 */
export interface HireState {
  profile: Profile;
  programDay: number;
  /** Stored progress plus synthetic "done" rows for stages the store already marks done (seeded hires). */
  progress: TaskProgress[];
  stageStatuses: Record<StageId, StageStatus>;
  taskStatuses: Record<string, TaskStatus>;
  xp: number;
  level: LevelInfo;
  rank: RankId;
  certification: Certification | null;
  certificationPassed: boolean;
  day90SignedOff: boolean;
  earnedTrophyIds: string[];
  streak: number;
  activityDays: number[];
  lastActivityDay: number | null;
  quests: Quest[];
  xpEvents: XpEvent[];
}

export type { RewardResult, TrophyAward } from "./reward-types";
import type { RewardResult, TrophyAward } from "./reward-types";

const CERT_TASK = tasks.find((t) => t.kind === "certification");

function dayOf(profile: Profile, iso: string | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : getProgramDay(profile, d);
}

export async function loadHireState(repo: Repository, profile: Profile, now: Date = new Date()): Promise<HireState> {
  const [stored, stageRows, xpEvents, trophies, certification, day90, quests, shadowLogs, kudos] = await Promise.all([
    repo.getTaskProgress(profile.id),
    repo.listStageProgress(profile.id),
    repo.listXpEvents(profile.id),
    repo.listTrophies(profile.id),
    repo.getCertification(profile.id, "days8-30"),
    repo.getCertification(profile.id, "days61-90"),
    repo.listQuests(profile.id),
    repo.listShadowLogs(profile.id),
    repo.listKudos(profile.id),
  ]);
  const programDay = getProgramDay(profile, now);

  // Seeded hires have stage rows but no task rows: treat their stored "done" stages as fully done.
  const progress = [...stored];
  const doneIds = new Set(stored.filter((p) => p.status === "done").map((p) => p.taskId));
  const synth = (t: TaskDef) => {
    if (doneIds.has(t.id)) return;
    doneIds.add(t.id);
    progress.push({ hireId: profile.id, taskId: t.id, status: "done", attempts: 1, data: { synthetic: true } });
  };
  for (const row of stageRows) {
    if (row.status !== "done") continue;
    tasks.filter((t) => t.stageId === row.stageId && t.required).forEach(synth);
  }
  if (certification?.status === "passed" && CERT_TASK) synth(CERT_TASK);

  const stageStatuses = computeStageStatuses(stages, tasks, progress, programDay);
  const taskStatuses = computeTaskStatuses(stages, tasks, progress, programDay);
  const certificationPassed = certification?.status === "passed" || isCertificationPassed(tasks, progress);
  const day90SignedOff = day90?.status === "passed";
  const xp = totalXp(xpEvents);

  const days = new Set<number>();
  for (const p of stored) {
    if (p.status !== "done") continue;
    const d = typeof p.data?.completedOnDay === "number" ? (p.data.completedOnDay as number) : dayOf(profile, p.completedAt);
    if (d !== null) days.add(d);
  }
  for (const e of xpEvents) {
    const d = dayOf(profile, e.at);
    if (d !== null && d <= programDay) days.add(d);
  }
  const activityDays = [...days].sort((a, b) => a - b);
  const lastActivityDay = activityDays.length ? activityDays[activityDays.length - 1] : null;
  const streak = currentStreak(activityDays, programDay);

  // Trophy rules that are not task-based need these counts; keep them on the state for awarding.
  const state: HireState = {
    profile,
    programDay,
    progress,
    stageStatuses,
    taskStatuses,
    xp,
    level: levelFromXp(xp),
    rank: rankFor(stageStatuses, certificationPassed, day90SignedOff),
    certification,
    certificationPassed,
    day90SignedOff,
    earnedTrophyIds: trophies.map((t) => t.trophyId),
    streak,
    activityDays,
    lastActivityDay,
    quests,
    xpEvents,
  };
  trophyCounts.set(state, {
    shadowLogs: shadowLogs.length,
    kudosGiven: kudos.filter((k) => k.fromId === profile.id).length,
  });
  return state;
}

const trophyCounts = new WeakMap<HireState, { shadowLogs: number; kudosGiven: number }>();

/** Evaluate trophies against the state and store any new ones. Returns the newly earned trophies. */
export async function awardNewTrophies(repo: Repository, state: HireState): Promise<TrophyAward[]> {
  const counts = trophyCounts.get(state) ?? { shadowLogs: 0, kudosGiven: 0 };
  const ids = evaluateTrophies({
    completedTaskIds: state.progress.filter((p) => p.status === "done" && !p.data?.synthetic).map((p) => p.taskId),
    questsConfirmed: state.quests.filter((q) => q.confirmedAt).length,
    shadowLogs: counts.shadowLogs,
    streak: state.streak,
    kudosGiven: counts.kudosGiven,
    certificationPassed: state.certificationPassed,
    day90SignedOff: state.day90SignedOff,
  });
  const out: TrophyAward[] = [];
  for (const id of ids) {
    if (state.earnedTrophyIds.includes(id)) continue;
    if (await repo.awardTrophy(state.profile.id, id)) {
      const def = TROPHY_DEFS.find((t) => t.id === id);
      if (def) out.push({ id, name: def.name, description: def.description, tier: def.tier });
    }
  }
  return out;
}

/** Keep stored stage rows in sync with the computed statuses. Returns titles of stages newly done. */
export async function syncStages(repo: Repository, before: HireState, after: HireState): Promise<string[]> {
  const done: string[] = [];
  for (const s of stages) {
    const now = after.stageStatuses[s.id];
    if (now === before.stageStatuses[s.id]) continue;
    await repo.upsertStageProgress({
      hireId: after.profile.id,
      stageId: s.id,
      status: now,
      completedAt: now === "done" ? new Date().toISOString() : undefined,
    });
    if (now === "done") done.push(s.title);
  }
  return done;
}

/**
 * Record a task attempt (pass or fail), award XP once, sync stages and award trophies.
 * Idempotent: a task already done returns alreadyDone with no new XP.
 */
export async function recordTaskResult(
  repo: Repository,
  profile: Profile,
  taskId: string,
  opts: { score?: number; data?: Record<string, unknown>; allowLocked?: boolean } = {},
): Promise<RewardResult> {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { ok: false, error: "Unknown task." };
  const before = await loadHireState(repo, profile);
  const status = before.taskStatuses[taskId];
  if (status === "done") {
    return { ok: true, passed: true, alreadyDone: true, xpGained: 0, trophies: [], stagesCompleted: [], score: opts.score };
  }
  if (status === "locked" && !opts.allowLocked) return { ok: false, error: "This task is still locked." };

  const prev = before.progress.find((p) => p.taskId === taskId);
  const passed = didPass(task, opts.score);
  await repo.upsertTaskProgress({
    hireId: profile.id,
    taskId,
    status: passed ? "done" : "failed",
    score: opts.score,
    attempts: (prev?.attempts ?? 0) + 1,
    data: { ...(prev?.data ?? {}), ...(opts.data ?? {}), completedOnDay: before.programDay },
    completedAt: passed ? new Date().toISOString() : undefined,
  });

  const earned = before.xpEvents.filter((e) => e.source === taskId || e.source === `${taskId}:fail`).reduce((a, e) => a + e.amount, 0);
  const amount = xpForTask(task, opts.score, earned);
  let xpGained = 0;
  if (amount > 0 && (await repo.addXpEvent({ hireId: profile.id, source: passed ? taskId : `${taskId}:fail`, amount }))) {
    xpGained = amount;
  }

  const after = await loadHireState(repo, profile);
  const stagesCompleted = await syncStages(repo, before, after);
  const trophies = await awardNewTrophies(repo, after);
  revalidatePath("/", "layout");
  return { ok: true, passed, alreadyDone: false, xpGained, trophies, stagesCompleted, score: opts.score };
}

/** Next 1-3 things to do, in the recommended order. */
export function nextTasks(state: HireState, limit = 3): TaskDef[] {
  return tasks.filter((t) => ["available", "in_progress", "failed"].includes(state.taskStatuses[t.id])).slice(0, limit);
}

/** The next locked task that unlocks by day (for "all caught up" states). */
export function nextUnlock(state: HireState): TaskDef | undefined {
  return tasks
    .filter((t) => state.taskStatuses[t.id] === "locked" && (t.unlockDay ?? 0) > state.programDay)
    .sort((a, b) => (a.unlockDay ?? 0) - (b.unlockDay ?? 0))[0];
}

export function currentStage(state: HireState) {
  return stages.find((s) => state.stageStatuses[s.id] === "active") ?? [...stages].reverse().find((s) => state.stageStatuses[s.id] === "done") ?? stages[0];
}

export function requiredPercent(state: HireState): number {
  const req = tasks.filter((t) => t.required);
  const done = req.filter((t) => state.taskStatuses[t.id] === "done").length;
  return req.length ? Math.round((done / req.length) * 100) : 0;
}

/** Risk flags for a hire, using the stored check-ins and pulses. */
export async function hireRisks(repo: Repository, state: HireState): Promise<RiskFlag[]> {
  const [pulses, checkins] = await Promise.all([repo.listPulses(state.profile.id), repo.listCheckins(state.profile.id)]);
  const obs = state.certification?.managerObservation as { failedCount?: number } | undefined;
  return riskFlags(
    state.profile,
    pulses,
    checkins,
    state.stageStatuses,
    { failed: state.certification?.status === "retest" ? Number(obs?.failedCount ?? 1) : 0, passed: state.certificationPassed },
    state.lastActivityDay,
    state.programDay,
    stages,
  );
}

/** Manager guard: the hire must exist and report to this manager. */
export async function getManagedHire(repo: Repository, manager: Profile, hireId: string): Promise<Profile | null> {
  const hire = await repo.getProfile(hireId);
  if (!hire || hire.role !== "hire" || hire.managerId !== manager.id) return null;
  return hire;
}

/**
 * DEMO ONLY: move the hire to the start of a stage. Earlier stages' required tasks are marked done
 * (flagged demoSkipped) so the unlock chain opens, then trophies are evaluated.
 */
export async function demoJumpToStage(repo: Repository, profile: Profile, stageId: StageId): Promise<RewardResult> {
  const target = stages.find((s) => s.id === stageId);
  if (!target) return { ok: false, error: "Unknown stage." };
  const before = await loadHireState(repo, profile);
  const baseDay = getProgramDay({ ...profile, demoDayOffset: 0 }, new Date());
  const day = Math.max(target.startDay, target.id === "preboarding" ? 0 : 1);
  await repo.setDemoDayOffset(profile.id, Math.max(0, day - baseDay));
  let xpGained = 0;
  for (const s of stages.filter((x) => x.order < target.order)) {
    for (const t of tasks.filter((x) => x.stageId === s.id && x.required)) {
      if (before.taskStatuses[t.id] === "done") continue;
      await repo.upsertTaskProgress({
        hireId: profile.id,
        taskId: t.id,
        status: "done",
        score: t.passScore,
        attempts: 1,
        data: { demoSkipped: true, completedOnDay: Math.max(1, Math.min(s.endDay, day)) },
        completedAt: new Date().toISOString(),
      });
      if (await repo.addXpEvent({ hireId: profile.id, source: t.id, amount: t.xp })) xpGained += t.xp;
    }
  }
  const fresh = (await repo.getProfile(profile.id)) ?? profile;
  const after = await loadHireState(repo, fresh);
  const stagesCompleted = await syncStages(repo, before, after);
  const trophies = await awardNewTrophies(repo, after);
  revalidatePath("/", "layout");
  return { ok: true, passed: true, alreadyDone: false, xpGained, trophies, stagesCompleted };
}
