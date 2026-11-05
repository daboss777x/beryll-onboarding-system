// Client-safe definitions for /review/[id] (task reviews) and the spaced-repetition session.
import type { ScorecardGoal } from "@/content";
import type { ScorecardItem } from "@/lib/data/types";

/** Route id of the spaced-repetition review session (missed quiz questions). */
export const SPACED_REVIEW_ID = "due";

export interface ReviewPrompt {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
}

export interface ReviewDef {
  id: string;
  eyebrow: string;
  intro: string;
  /** Who the hire does this with, shown on the screen. */
  withWhom: "your manager" | "yourself";
  /** "agree": read the goals and confirm. "assess": rate each goal met / partly / not yet. */
  scorecard?: "agree" | "assess";
  ratings?: { id: string; label: string }[];
  prompts: ReviewPrompt[];
  /** Required confirmation checkbox. */
  confirm?: string;
  doneCopy: string;
}

const quarterly = (id: string, when: string, focus: string): ReviewDef => ({
  id,
  eyebrow: "Quarterly check-in",
  intro: `${when}. Jot a few notes before you sit down with your manager. ${focus}`,
  withWhom: "your manager",
  prompts: [
    { id: "going-well", label: "What is going well?", required: true },
    { id: "clumsy", label: "What still feels clumsy or slow?" },
    { id: "next", label: "One thing you want to grow next quarter", required: true },
  ],
  confirm: "I have had this conversation with my manager",
  doneCopy: "Notes saved. Your manager sees them before your next check-in.",
});

export const REVIEW_DEFS: Record<string, ReviewDef> = {
  "scorecard-agree": {
    id: "scorecard-agree",
    eyebrow: "Weeks 1-2",
    intro: "These are the goals for your first 90 days. Go through them with your manager, ask what good looks like, then confirm you have agreed them.",
    withWhom: "your manager",
    scorecard: "agree",
    prompts: [{ id: "questions", label: "Anything you want changed or clarified?", hint: "Optional. Your manager sees this." }],
    confirm: "I have gone through these goals with my manager and we agree them",
    doneCopy: "Scorecard agreed. You will review it together at day 90.",
  },
  "qa-sampling": {
    id: "qa-sampling",
    eyebrow: "Days 31-60",
    intro: "Your manager scores one in five of your real client emails and calls. Point them at good examples and say where you want feedback.",
    withWhom: "your manager",
    prompts: [
      { id: "samples", label: "Which emails or calls should your manager look at?", hint: "Client, date and a one-line summary for each. No client data beyond the name.", required: true },
      { id: "feedback-on", label: "Where do you most want feedback?", required: true },
    ],
    confirm: "I have shared these samples with my manager",
    doneCopy: "Samples shared. Your manager's QA scores appear on your record.",
  },
  "scorecard-90": {
    id: "scorecard-90",
    eyebrow: "Days 61-90",
    intro: "Rate yourself on each goal first, then compare notes with your manager. Be honest: a 'partly' with a clear plan beats a hopeful 'met'.",
    withWhom: "your manager",
    scorecard: "assess",
    prompts: [{ id: "evidence", label: "Your strongest evidence", hint: "A contract, a renewal, a client email you are proud of.", required: true }],
    doneCopy: "Self-assessment saved. Your manager signs off the day-90 review.",
  },
  "90-day-conversation": {
    id: "90-day-conversation",
    eyebrow: "Days 61-90",
    intro: "A proper talk about how it is going and what comes next. Prepare a few notes so the hour is about you, not the agenda.",
    withWhom: "your manager",
    prompts: [
      { id: "proud", label: "What are you proudest of so far?", required: true },
      { id: "surprised", label: "What surprised you about the job?" },
      { id: "support", label: "What support do you need for the next quarter?", required: true },
      { id: "growth", label: "Where do you want to be in a year?" },
    ],
    confirm: "I have had the 90-day conversation with my manager",
    doneCopy: "Notes saved. These shape your next quarter's goals.",
  },
  "programme-review": {
    id: "programme-review",
    eyebrow: "Days 61-90",
    intro: "Tell us what worked and what did not. The next hire gets a better onboarding because of your answers.",
    withWhom: "yourself",
    ratings: [
      { id: "clarity", label: "I knew what was expected of me" },
      { id: "pace", label: "The pace felt right" },
      { id: "people", label: "I met the people I needed to" },
      { id: "tools", label: "The practice labs and walkthroughs helped" },
      { id: "overall", label: "Overall, this was a good onboarding" },
    ],
    prompts: [
      { id: "keep", label: "Keep: what should we never drop?" },
      { id: "change", label: "Change: one thing to fix for the next hire", required: true },
    ],
    doneCopy: "Thank you. Your review goes to the people team, anonymised in reports.",
  },
  "quarterly-month-4": quarterly("quarterly-month-4", "Month 4", "What has settled in, and what still feels clumsy?"),
  "quarterly-month-6": quarterly("quarterly-month-6", "Month 6", "Half a year: accounts, goals and growth."),
  "quarterly-month-9": quarterly("quarterly-month-9", "Month 9", "Pick one skill to grow and one process to improve."),
  "quarterly-month-12": quarterly("quarterly-month-12", "Month 12", "A full year. Look back, then set next year's goals."),
};

export const ASSESS_OPTIONS = [
  { v: "met", label: "Met" },
  { v: "partly", label: "Partly" },
  { v: "not_met", label: "Not yet" },
] as const;
export type AssessValue = (typeof ASSESS_OPTIONS)[number]["v"];

export interface ScorecardRow {
  id: string;
  horizon: 30 | 60 | 90;
  goal: string;
  target: string;
  status?: ScorecardItem["status"];
}

/**
 * Adapter: the hire's stored scorecard items, or the content goals when none are stored yet.
 * TODO(Davis): drop the content fallback once every hire has seeded scorecard rows.
 */
export function scorecardRows(items: ScorecardItem[], goals: ScorecardGoal[]): ScorecardRow[] {
  const rows: ScorecardRow[] = items.length
    ? items.map((i) => ({ id: i.id, horizon: i.horizon, goal: i.goal, target: i.target, status: i.status }))
    : goals.map((g) => ({ id: g.id, horizon: g.horizon, goal: g.title, target: g.target }));
  return rows.sort((a, b) => a.horizon - b.horizon);
}
