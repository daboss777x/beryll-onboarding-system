// Client-safe copy and helpers for /people and the matcher.
import type { StaffMember } from "@/lib/types";

/** Quest types (match content/schema.ts questSchema and lib/data/seed.ts titles). */
export const QUEST_TYPES = {
  "buddy-intro": { label: "Buddy intro", title: (n: string) => `Buddy intro with ${n}` },
  coffee: { label: "Coffee chat", title: (n: string) => `Coffee with ${n}` },
  "scoping-call": { label: "Shadow a scoping call", title: (n: string) => `Shadow a scoping call with ${n}` },
  "cross-team": { label: "Cross-team hour", title: (n: string) => `Cross-team project with ${n}` },
} as const;
export type QuestType = keyof typeof QUEST_TYPES;
export const isQuestType = (v: unknown): v is QuestType => typeof v === "string" && v in QUEST_TYPES;

/** Which roadmap task a confirmed quest of this type completes. */
export const QUEST_TASK: Partial<Record<QuestType, string>> = {
  "buddy-intro": "day1-meet-buddy",
  "cross-team": "d60-cross-team",
};

export const TEAM_ORDER: StaffMember["team"][] = ["Leadership", "Commercial", "Offensive Security", "Defensive Security / SOC", "GRC", "Operations"];

export function groupByTeam(list: StaffMember[]): { team: StaffMember["team"]; people: StaffMember[] }[] {
  return TEAM_ORDER.map((team) => ({ team, people: list.filter((s) => s.team === team) })).filter((g) => g.people.length);
}

/** Human label for a matcher visibility key ("interests", "funFacts", "preferences", "interest:<x>"). */
export function visibilityLabel(key: string): string {
  if (key === "interests") return "My interests list";
  if (key === "funFacts") return "Fun facts";
  if (key === "preferences") return "Working and social style";
  if (key.startsWith("interest:")) return `Interest: ${key.slice("interest:".length)}`;
  return key;
}

/** Order: the three group keys first, then individual interests. */
export function sortVisibilityKeys(keys: string[]): string[] {
  const head = ["interests", "preferences", "funFacts"].filter((k) => keys.includes(k));
  return [...head, ...keys.filter((k) => !head.includes(k)).sort()];
}

export const SHADOW_KINDS = ["Client discovery call", "Scoping session", "Renewal meeting", "Contract negotiation", "Report read-out", "Internal pipeline review", "Other"] as const;
