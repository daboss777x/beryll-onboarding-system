/**
 * XP and levels.
 *  - totalXp(events): sum of positive, finite amounts; exact duplicate events (hire+source+at+amount) count once.
 *  - xpForLevel(n): cumulative XP to reach level n = 50*n*(n-1)  (L1=0, L2=100, L3=300, L4=600 ...)
 *  - levelFromXp(xp): { level, xpIntoLevel, xpForNext, progress (0-1) }
 *  - xpForTask(task, score, alreadyEarned?): full task.xp on pass, 25% (floored) on fail,
 *    minus whatever the hire already earned from this task, never below 0 (so re-passes give 0).
 *    A task with no passScore always counts as passed. score undefined on a scored task counts as a fail.
 */
import type { TaskDef, XpEvent } from "../types";

export const FAIL_XP_FRACTION = 0.25;

export function totalXp(events: readonly XpEvent[]): number {
  const seen = new Set<string>();
  let sum = 0;
  for (const e of events) {
    if (!Number.isFinite(e.amount) || e.amount <= 0) continue;
    const key = `${e.hireId}|${e.source}|${e.at}|${e.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sum += e.amount;
  }
  return sum;
}

export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 50 * n * (n - 1);
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number;
}

export function levelFromXp(xp: number): LevelInfo {
  const x = Math.max(0, Number.isFinite(xp) ? xp : 0);
  let level = 1;
  while (xpForLevel(level + 1) <= x) level++;
  const floor = xpForLevel(level);
  const span = xpForLevel(level + 1) - floor;
  const into = x - floor;
  return { level, xpIntoLevel: into, xpForNext: span, progress: span ? into / span : 0 };
}

export function didPass(task: Pick<TaskDef, "passScore">, score?: number): boolean {
  if (task.passScore === undefined) return true;
  return score !== undefined && score >= task.passScore;
}

export function xpForTask(task: Pick<TaskDef, "xp" | "passScore">, score?: number, alreadyEarned = 0): number {
  const award = didPass(task, score) ? task.xp : Math.floor(task.xp * FAIL_XP_FRACTION);
  return Math.max(0, award - Math.max(0, alreadyEarned));
}
