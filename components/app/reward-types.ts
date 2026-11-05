// Client-safe copy of the reward result shape (hire-state.ts is server-only).
export interface TrophyAward {
  id: string;
  name: string;
  description: string;
  tier: "facet" | "gem" | "crown";
}

export type RewardResult =
  | { ok: true; passed: boolean; alreadyDone: boolean; xpGained: number; trophies: TrophyAward[]; stagesCompleted: string[]; score?: number }
  | { ok: false; error: string };
