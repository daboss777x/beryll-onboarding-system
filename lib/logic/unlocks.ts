/**
 * Stage / task unlock state machine.
 *
 * Rules (spec C5):
 *  1. Stages are sequential (by `order`). A stage is "active" when
 *     (a) programDay >= stage.startDay, AND
 *     (b) the previous stage is "done", AND
 *     (c) if stage.playable is "light" or "cards", certification has been passed
 *         (the task with kind "certification" is done). First stage skips (b).
 *  2. A stage is "done" when it is unlocked and every `required` task in it is done.
 *     A stage with no required tasks (e.g. months4-12 cards) never becomes done.
 *  3. Otherwise a stage is "locked".
 *  4. Task status: "done" is always kept. Otherwise the task is "locked" unless its stage is
 *     active/done AND (task.unlockDay ?? stage.startDay) <= programDay; then it is
 *     "in_progress"/"failed" if progress says so, else "available".
 *  5. The certification task additionally needs every OTHER required task in its own stage done,
 *     except pulse surveys (a later pulse must never block certification).
 */
import type { StageDef, StageId, TaskDef, TaskProgress, TaskStatus } from "../types";

export type StageStatus = "locked" | "active" | "done";

/** One row per task: a "done" row wins, otherwise the last row wins. */
function bestProgress(progress: readonly TaskProgress[]): Map<string, TaskProgress> {
  const m = new Map<string, TaskProgress>();
  for (const p of progress) {
    if (m.get(p.taskId)?.status === "done") continue;
    m.set(p.taskId, p);
  }
  return m;
}

export function isTaskDone(taskId: string, progress: readonly TaskProgress[]): boolean {
  return progress.some((p) => p.taskId === taskId && p.status === "done");
}

/** True when the certification task(s) are done. If there is no certification task, false. */
export function isCertificationPassed(tasks: readonly TaskDef[], progress: readonly TaskProgress[]): boolean {
  const certs = tasks.filter((t) => t.kind === "certification");
  return certs.length > 0 && certs.every((t) => isTaskDone(t.id, progress));
}

export function computeStageStatuses(
  stages: readonly StageDef[],
  tasks: readonly TaskDef[],
  progress: readonly TaskProgress[],
  programDay: number,
): Record<StageId, StageStatus> {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const certPassed = isCertificationPassed(tasks, progress);
  const out = {} as Record<StageId, StageStatus>;
  let prevDone = true;
  for (const s of sorted) {
    const dayOk = programDay >= s.startDay;
    const certOk = s.playable === "full" || certPassed;
    const unlocked = dayOk && prevDone && certOk;
    const required = tasks.filter((t) => t.stageId === s.id && t.required);
    const allDone = required.length > 0 && required.every((t) => isTaskDone(t.id, progress));
    out[s.id] = unlocked ? (allDone ? "done" : "active") : "locked";
    prevDone = out[s.id] === "done";
  }
  return out;
}

export function computeTaskStatuses(
  stages: readonly StageDef[],
  tasks: readonly TaskDef[],
  progress: readonly TaskProgress[],
  programDay: number,
): Record<string, TaskStatus> {
  const stageStatus = computeStageStatuses(stages, tasks, progress, programDay);
  const stageById = new Map(stages.map((s) => [s.id, s]));
  const prog = bestProgress(progress);
  const out: Record<string, TaskStatus> = {};
  for (const t of tasks) {
    const p = prog.get(t.id);
    if (p?.status === "done") {
      out[t.id] = "done";
      continue;
    }
    const stage = stageById.get(t.stageId);
    const ss = stageStatus[t.stageId];
    if (!stage || !ss || ss === "locked") {
      out[t.id] = "locked";
      continue;
    }
    if ((t.unlockDay ?? stage.startDay) > programDay) {
      out[t.id] = "locked";
      continue;
    }
    if (t.kind === "certification") {
      const others = tasks.filter((o) => o.stageId === t.stageId && o.required && o.id !== t.id && o.kind !== "pulse");
      if (!others.every((o) => isTaskDone(o.id, progress))) {
        out[t.id] = "locked";
        continue;
      }
    }
    out[t.id] = p?.status === "in_progress" || p?.status === "failed" ? p.status : "available";
  }
  return out;
}
