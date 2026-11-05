/**
 * Quiz scoring and the certification decision.
 *
 * Quiz: single = exact id match; multi = exact set match (order and duplicates ignored); ordering = exact sequence.
 * All-or-nothing per question; optional `points` weight (default 1). Score is 0-100, rounded.
 * Unanswered = wrong.
 *
 * Certification: passed only if AI overall >= 75 AND a complete manager observation exists with every criterion >= 3 (of 5).
 * Otherwise "retest" with a coaching list (AI coaching + one line per weak criterion).
 */
import type { RoleplayResult } from "../types";

export type QuizQuestion =
  | { id: string; type: "single"; correct: string; points?: number }
  | { id: string; type: "multi"; correct: string[]; points?: number }
  | { id: string; type: "ordering"; correct: string[]; points?: number };

export type QuizAnswers = Record<string, string | string[] | undefined>;

export interface QuizResult {
  score: number;
  correctCount: number;
  total: number;
  perQuestion: { id: string; correct: boolean }[];
  missedIds: string[];
}

function isCorrect(q: QuizQuestion, a: string | string[] | undefined): boolean {
  if (a === undefined) return false;
  if (q.type === "single") return typeof a === "string" && a === q.correct;
  const arr = Array.isArray(a) ? a : [a];
  if (q.type === "ordering") return arr.length === q.correct.length && arr.every((x, i) => x === q.correct[i]);
  const got = new Set(arr);
  const want = new Set(q.correct);
  return got.size === want.size && [...want].every((x) => got.has(x));
}

export function scoreQuiz(questions: readonly QuizQuestion[], answers: QuizAnswers): QuizResult {
  let earned = 0;
  let possible = 0;
  const perQuestion = questions.map((q) => {
    const w = q.points ?? 1;
    const ok = isCorrect(q, answers[q.id]);
    possible += w;
    if (ok) earned += w;
    return { id: q.id, correct: ok };
  });
  return {
    score: possible ? Math.round((earned / possible) * 100) : 0,
    correctCount: perQuestion.filter((p) => p.correct).length,
    total: questions.length,
    perQuestion,
    missedIds: perQuestion.filter((p) => !p.correct).map((p) => p.id),
  };
}

export const AI_PASS_SCORE = 75;
export const MANAGER_MIN_CRITERION = 3;

export interface ManagerObservation {
  scores: { criterion: string; score: number }[];
}

export interface CertificationDecision {
  decision: "passed" | "retest";
  aiPassed: boolean;
  managerPassed: boolean;
  /** true when the manager observation is missing/empty, so the decision is provisional */
  observationMissing: boolean;
  coaching: string[];
}

export function certificationDecision(
  ai: Pick<RoleplayResult, "overall" | "coaching">,
  observation: ManagerObservation | undefined,
): CertificationDecision {
  const aiPassed = ai.overall >= AI_PASS_SCORE;
  const obs = observation?.scores ?? [];
  const observationMissing = obs.length === 0;
  const weak = obs.filter((s) => s.score < MANAGER_MIN_CRITERION);
  const managerPassed = !observationMissing && weak.length === 0;
  const coaching: string[] = [];
  if (!aiPassed) coaching.push(`AI role-play score ${ai.overall}/100 is below the ${AI_PASS_SCORE} needed. Review the feedback and try again.`);
  coaching.push(...ai.coaching);
  if (observationMissing) coaching.push("Your manager still needs to complete the observation.");
  for (const w of weak) coaching.push(`Manager observation: "${w.criterion}" scored ${w.score}/5 (needs ${MANAGER_MIN_CRITERION}+). Practise this with your manager.`);
  return {
    decision: aiPassed && managerPassed ? "passed" : "retest",
    aiPassed,
    managerPassed,
    observationMissing,
    coaching: [...new Set(coaching)],
  };
}
