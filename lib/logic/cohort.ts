/**
 * Cohort metrics (spec 7), count-based for small headcount.
 *  computeCohortMetrics({ hires, tasks, progress, pulses }) returns
 *   - timeToCertification: { certifiedCount, total, averageDays|null, fastestDays|null, slowestDays|null }
 *   - processCompletion: { averagePercent, perHire: {hireId, percent}[] }  (required tasks done / required tasks)
 *   - retention90: { eligible, retained, label "x of y" }  eligible = hires who reached program day 90; retained = still active
 *   - averagePulse: { clarity, confidence, belonging } each number|null, plus responses count
 * Percentages and averages are rounded to 1 decimal. Duplicate progress/pulse rows are de-duplicated
 * (done tasks counted once; latest pulse per hire+day wins).
 */
import type { Pulse, TaskDef, TaskProgress } from "../types";

export interface CohortHire {
  hireId: string;
  programDay: number;
  active: boolean;
  certifiedOnDay?: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function computeCohortMetrics(input: {
  hires: readonly CohortHire[];
  tasks: readonly TaskDef[];
  progress: readonly TaskProgress[];
  pulses: readonly Pulse[];
}) {
  const { hires, tasks, progress, pulses } = input;

  const certDays = hires.filter((h) => h.certifiedOnDay !== undefined).map((h) => h.certifiedOnDay as number);
  const timeToCertification = {
    certifiedCount: certDays.length,
    total: hires.length,
    averageDays: certDays.length ? r1(certDays.reduce((a, b) => a + b, 0) / certDays.length) : null,
    fastestDays: certDays.length ? Math.min(...certDays) : null,
    slowestDays: certDays.length ? Math.max(...certDays) : null,
  };

  const required = tasks.filter((t) => t.required);
  const perHire = hires.map((h) => {
    const done = new Set(progress.filter((p) => p.hireId === h.hireId && p.status === "done").map((p) => p.taskId));
    const n = required.filter((t) => done.has(t.id)).length;
    return { hireId: h.hireId, percent: required.length ? r1((n / required.length) * 100) : 0 };
  });
  const processCompletion = {
    averagePercent: perHire.length ? r1(perHire.reduce((a, p) => a + p.percent, 0) / perHire.length) : 0,
    perHire,
  };

  const eligible = hires.filter((h) => h.programDay >= 90);
  const retained = eligible.filter((h) => h.active).length;
  const retention90 = { eligible: eligible.length, retained, label: `${retained} of ${eligible.length}` };

  const latest = new Map<string, Pulse>();
  for (const p of pulses) latest.set(`${p.hireId}|${p.day}`, p);
  const rows = [...latest.values()];
  const avg = (k: "clarity" | "confidence" | "belonging") => (rows.length ? r1(rows.reduce((a, p) => a + p[k], 0) / rows.length) : null);
  const averagePulse = { clarity: avg("clarity"), confidence: avg("confidence"), belonging: avg("belonging"), responses: rows.length };

  return { timeToCertification, processCompletion, retention90, averagePulse };
}
