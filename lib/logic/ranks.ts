/**
 * Rank ladder: observer -> copilot (weeks1-2 done) -> solo (certified) -> independent (certified + day-90 sign-off).
 * Certification implies at least solo even if weeks1-2 status is missing. A sign-off without certification is ignored.
 */
import type { RankId, StageId } from "../types";
import type { StageStatus } from "./unlocks";

export const RANK_ORDER: RankId[] = ["observer", "copilot", "solo", "independent"];

export function rankFor(
  stageStatuses: Partial<Record<StageId, StageStatus>>,
  certificationPassed: boolean,
  day90SignedOff: boolean,
): RankId {
  if (certificationPassed && day90SignedOff) return "independent";
  if (certificationPassed) return "solo";
  if (stageStatuses["weeks1-2"] === "done") return "copilot";
  return "observer";
}
