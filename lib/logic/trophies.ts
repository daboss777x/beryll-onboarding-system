/**
 * Trophies. evaluateTrophies(state, taskMap?) returns earned trophy ids in TROPHY_DEFS order.
 * Pure and idempotent: same state in -> same ids out; earning is never revoked by this function
 * (callers should union with already-stored trophies).
 *
 * Task-based trophies need ALL of the listed task ids done. The ids in TROPHY_TASK_MAP are placeholders
 * until content (Tom) fixes real ids; pass an override map as the 2nd argument or edit the constant.
 */
import type { TrophyDef } from "../types";

export const TROPHY_DEFS: TrophyDef[] = [
  { id: "first-steps", name: "First Steps", description: "Complete your first task.", icon: "footprints", tier: "facet" },
  { id: "best-self", name: "Best Self", description: "Share your Best Self story.", icon: "sparkles", tier: "facet" },
  { id: "three-things", name: "Three Things", description: "Pick your three things for the first week.", icon: "list-checks", tier: "facet" },
  { id: "pipeline-pro", name: "Pipeline Pro", description: "Master the pipeline walkthrough.", icon: "workflow", tier: "gem" },
  { id: "clause-hunter", name: "Clause Hunter", description: "Finish the Redline Lab.", icon: "search", tier: "gem" },
  { id: "signature-guardian", name: "Signature Guardian", description: "Complete the signature story.", icon: "pen-line", tier: "gem" },
  { id: "phish-spotter", name: "Phish Spotter", description: "Spot the test phishing email.", icon: "fish", tier: "facet" },
  { id: "data-steward", name: "Data Steward", description: "Pass the data-handling drills.", icon: "shield-check", tier: "gem" },
  { id: "connector", name: "Connector", description: "Get 3 meet-the-team quests confirmed.", icon: "users", tier: "gem" },
  { id: "shadow-scholar", name: "Shadow Scholar", description: "Log 5 shadowed interactions.", icon: "eye", tier: "gem" },
  { id: "certified-for-solo", name: "Certified for Solo", description: "Pass certification.", icon: "badge-check", tier: "crown" },
  { id: "streak-5", name: "Streak 5", description: "Complete tasks on 5 program days in a row.", icon: "flame", tier: "facet" },
  { id: "kudos-giver", name: "Kudos Giver", description: "Send kudos to a colleague.", icon: "heart-handshake", tier: "facet" },
  { id: "sop-fixer", name: "SOP Fixer", description: "Submit your fix-one-SOP mission.", icon: "wrench", tier: "gem" },
  { id: "independent", name: "Independent", description: "Day-90 sign-off from your manager.", icon: "crown", tier: "crown" },
];

export const TROPHY_TASK_MAP: Record<string, string[]> = {
  "best-self": ["day1-best-self"],
  "three-things": ["day1-three-things"],
  "pipeline-pro": ["wt-pipeline-solo"],
  "clause-hunter": ["lab-redline"],
  "signature-guardian": ["lab-signature-story"],
  "phish-spotter": ["lab-phish-email"],
  "data-steward": ["lab-data-handling"],
  "sop-fixer": ["mission-fix-sop"],
};

export interface TrophyState {
  completedTaskIds: readonly string[];
  questsConfirmed: number;
  shadowLogs: number;
  streak: number;
  kudosGiven: number;
  certificationPassed: boolean;
  day90SignedOff: boolean;
}

export function evaluateTrophies(state: TrophyState, taskMap: Record<string, string[]> = TROPHY_TASK_MAP): string[] {
  const done = new Set(state.completedTaskIds);
  const tasksDone = (id: string) => (taskMap[id]?.length ?? 0) > 0 && taskMap[id].every((t) => done.has(t));
  const rules: Record<string, boolean> = {
    "first-steps": done.size >= 1,
    "best-self": tasksDone("best-self"),
    "three-things": tasksDone("three-things"),
    "pipeline-pro": tasksDone("pipeline-pro"),
    "clause-hunter": tasksDone("clause-hunter"),
    "signature-guardian": tasksDone("signature-guardian"),
    "phish-spotter": tasksDone("phish-spotter"),
    "data-steward": tasksDone("data-steward"),
    connector: state.questsConfirmed >= 3,
    "shadow-scholar": state.shadowLogs >= 5,
    "certified-for-solo": state.certificationPassed,
    "streak-5": state.streak >= 5,
    "kudos-giver": state.kudosGiven >= 1,
    "sop-fixer": tasksDone("sop-fixer"),
    independent: state.day90SignedOff && state.certificationPassed,
  };
  return TROPHY_DEFS.filter((t) => rules[t.id]).map((t) => t.id);
}
