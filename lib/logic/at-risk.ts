/**
 * At-risk flags (spec C6). riskFlags(...) returns zero or more RiskFlag, at most one per reason, in this order:
 *  low_pulse                   any submitted pulse dimension <= 2 (lists which)
 *  overdue_checkin             a check-in not held whose dueDay + 3 < programDay (i.e. overdue by MORE than 3 days)
 *  stalled_stage               an "active" stage with programDay > endDay + 5
 *  failed_certification_twice  certAttempts.failed >= 2 and not passed
 *  inactive                    programDay >= 1 and programDay - lastActivityDay >= 5 (null last activity counts as day 0)
 * Pulses and check-ins for other hires are ignored.
 */
import type { CheckIn, Profile, Pulse, RiskFlag, StageDef, StageId } from "../types";
import type { StageStatus } from "./unlocks";

export const CHECKIN_OVERDUE_GRACE_DAYS = 3;
export const STALL_GRACE_DAYS = 5;
export const INACTIVE_DAYS = 5;

export interface CertAttempts {
  failed: number;
  passed: boolean;
}

export function riskFlags(
  hire: Pick<Profile, "id" | "name">,
  pulses: readonly Pulse[],
  checkins: readonly CheckIn[],
  stageStatuses: Partial<Record<StageId, StageStatus>>,
  certAttempts: CertAttempts,
  lastActivityDay: number | null,
  programDay: number,
  stages: readonly StageDef[],
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const first = hire.name?.split(" ")[0] ?? "the hire";
  const push = (reason: RiskFlag["reason"], detail: string, suggestedAction: string) =>
    flags.push({ hireId: hire.id, reason, detail, suggestedAction });

  const low: string[] = [];
  for (const p of pulses.filter((x) => x.hireId === hire.id)) {
    for (const dim of ["clarity", "confidence", "belonging"] as const) {
      if (p[dim] <= 2) low.push(`${dim} ${p[dim]}/5 (day ${p.day})`);
    }
  }
  if (low.length) push("low_pulse", `Low pulse score: ${low.join(", ")}.`, `Hold a 1:1 with ${first} this week and ask what would help most.`);

  const overdue = checkins
    .filter((c) => c.hireId === hire.id && !c.heldAt && programDay - c.dueDay > CHECKIN_OVERDUE_GRACE_DAYS)
    .sort((a, b) => a.dueDay - b.dueDay);
  if (overdue.length) {
    const c = overdue[0];
    push(
      "overdue_checkin",
      `"${c.label}" check-in was due on day ${c.dueDay} and is ${programDay - c.dueDay} days overdue${overdue.length > 1 ? ` (${overdue.length} overdue in total)` : ""}.`,
      `Book the "${c.label}" check-in with ${first} now.`,
    );
  }

  const stalled = stages.find((s) => stageStatuses[s.id] === "active" && programDay > s.endDay + STALL_GRACE_DAYS);
  if (stalled) {
    push(
      "stalled_stage",
      `"${stalled.title}" should have finished by day ${stalled.endDay} but is still open on day ${programDay}.`,
      `Review what is blocking ${first} in "${stalled.title}" and agree a plan to finish it.`,
    );
  }

  if (certAttempts.failed >= 2 && !certAttempts.passed) {
    push(
      "failed_certification_twice",
      `Certification failed ${certAttempts.failed} times.`,
      `Run a coaching session with ${first} on the weak criteria before the next attempt.`,
    );
  }

  const last = lastActivityDay ?? 0;
  if (programDay >= 1 && programDay - last >= INACTIVE_DAYS) {
    push(
      "inactive",
      lastActivityDay === null ? `No activity yet, ${programDay} program days in.` : `No activity for ${programDay - last} program days (last on day ${last}).`,
      `Check in with ${first} directly and with their buddy.`,
    );
  }
  return flags;
}
