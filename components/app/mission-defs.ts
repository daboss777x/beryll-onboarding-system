// Client-safe definitions for /missions/[id] (real-work missions in the later stages).

export interface MissionDef {
  id: string;
  eyebrow: string;
  intro: string;
  steps: string[];
}

export const MISSION_DEFS: Record<string, MissionDef> = {
  "fix-one-sop": {
    id: "fix-one-sop",
    eyebrow: "Days 31-60 mission",
    intro: "You have used our SOPs for a month. Pick one, find something that slowed you down or confused you, and propose a concrete fix to its owner.",
    steps: [
      "Choose the SOP you used most, or the one that tripped you up.",
      "Quote or name the part that could be better.",
      "Write the fix as you would want it to read, and say why it helps the next hire.",
    ],
  },
};

export const SUGGESTION_LIMITS = { section: 160, problem: 1500, fix: 2000, min: 20 } as const;
