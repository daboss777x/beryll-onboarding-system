import "server-only";
import { tasks } from "@/content";
import type { Repository } from "@/lib/data";
import type { CheckInRecord } from "@/lib/data/types";
import { computeCohortMetrics, defaultCheckins, getProgramDay, type CohortHire } from "@/lib/logic";
import type { Profile, Pulse, RiskFlag } from "@/lib/types";
import { currentStage, hireRisks, loadHireState, requiredPercent, type HireState } from "./hire-state";

export interface HireSummary {
  profile: Profile;
  state: HireState;
  risks: RiskFlag[];
  pulses: Pulse[];
  checkins: CheckInRecord[];
  percent: number;
  stageTitle: string;
  nextCheckin: CheckInRecord | undefined;
  overdueCheckins: CheckInRecord[];
}

/** Schedule from lib/logic merged with what the store holds (stored rows win per due day). */
export function mergeCheckins(hireId: string, stored: CheckInRecord[]): CheckInRecord[] {
  const byDay = new Map<number, CheckInRecord>();
  for (const c of defaultCheckins(hireId)) byDay.set(c.dueDay, c);
  for (const c of stored) byDay.set(c.dueDay, { ...byDay.get(c.dueDay), ...c });
  return [...byDay.values()].sort((a, b) => a.dueDay - b.dueDay);
}

export async function loadHireSummary(repo: Repository, profile: Profile): Promise<HireSummary> {
  const state = await loadHireState(repo, profile);
  const [risks, pulses, stored] = await Promise.all([hireRisks(repo, state), repo.listPulses(profile.id), repo.listCheckins(profile.id)]);
  const checkins = mergeCheckins(profile.id, stored);
  const open = checkins.filter((c) => !c.heldAt);
  return {
    profile,
    state,
    risks,
    pulses,
    checkins,
    percent: requiredPercent(state),
    stageTitle: currentStage(state).title,
    nextCheckin: open.find((c) => c.dueDay >= state.programDay),
    overdueCheckins: open.filter((c) => c.dueDay < state.programDay),
  };
}

export function certifiedOnDay(s: HireSummary): number | undefined {
  const at = s.state.certification?.status === "passed" ? s.state.certification.signedAt ?? s.state.certification.updatedAt : undefined;
  if (!at) return undefined;
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? undefined : getProgramDay(s.profile, d);
}

export function cohortMetrics(summaries: HireSummary[]) {
  const hires: CohortHire[] = summaries.map((s) => ({ hireId: s.profile.id, programDay: s.state.programDay, active: true, certifiedOnDay: certifiedOnDay(s) }));
  return computeCohortMetrics({
    hires,
    tasks,
    progress: summaries.flatMap((s) => s.state.progress),
    pulses: summaries.flatMap((s) => s.pulses),
  });
}

