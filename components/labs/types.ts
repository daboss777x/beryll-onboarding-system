// Client-safe result shapes shared by the lab server actions and the lab components.
import type { RewardResult } from "@/components/app/reward-types";

export interface LabGradeView {
  score: number;
  strengths: string[];
  gaps: string[];
  modelAnswerExcerpt: string;
  mode: "live" | "fallback";
}

export type LabErrorCode = "rate_limited" | "locked" | "bad_request" | "not_found" | "server_error";
export type LabError = { ok: false; error: string; code?: LabErrorCode };

export type GradeActionResult =
  | {
      ok: true;
      grade: LabGradeView;
      /** Best score per item so far (server-side record). */
      best: Record<string, number>;
      /** Combined lab score once enough items are graded, else null. */
      labScore: number | null;
      /** Set when the attempt was recorded against the roadmap task. */
      reward: RewardResult | null;
    }
  | LabError;

export interface DrillFeedback {
  drillId: string;
  chosenOptionId: string;
  correct: boolean;
  correctOptionId: string;
  explanation: string;
  sopTitle?: string;
}

export type DrillCheckResult = ({ ok: true } & DrillFeedback) | LabError;

export type DrillSubmitResult =
  | { ok: true; score: number; correct: number; total: number; passScore: number; passed: boolean; reward: RewardResult }
  | LabError;

export type StorySubmitResult = { ok: true; endingKind: "good" | "mixed" | "bad"; passed: boolean; reward: RewardResult } | LabError;

export interface PhishFlagView {
  id: string;
  where: string;
  description: string;
  found: boolean;
}

export type PhishSubmitResult =
  | {
      ok: true;
      score: number;
      actionCorrect: boolean;
      foundCount: number;
      missedCount: number;
      falseAlarmCount: number;
      /** Every red flag and the correct action: only on a pass, or once the task is done. Null otherwise. */
      reveal: { flags: PhishFlagView[]; correctAction: string } | null;
      /** null when the attempt was not recorded (wrong action: try again). */
      reward: RewardResult | null;
    }
  | LabError;
