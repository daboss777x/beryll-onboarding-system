import { dublinDateString } from "@/lib/logic/program-day";

/**
 * Pure rules for quiz and review server actions (app/(hire)/actions.ts), kept here so they are
 * unit-tested. No answer keys live in this file: callers pass the key in from content/server.
 */

/** Quiz submissions allowed per quiz per (Dublin) calendar day. Stops brute-forcing the key. */
export const QUIZ_ATTEMPTS_PER_DAY = 10;

export interface QuizFeedback {
  questionId: string;
  correct: boolean;
  /** Only present when the answers are revealed (attempt passed, or the quiz was already done). */
  correctOptionIds?: string[];
  /** Only present when the answers are revealed: explanations often name the right option. */
  explanation?: string;
  /** Lesson to re-read for a missed question. Safe to send on any attempt. */
  reviewModuleId?: string;
}

export interface QuizKeyItemLike {
  questionId: string;
  correct: string[];
  explanation?: string;
  reviewModuleId?: string;
}

/** Reveal the key only once it can no longer be used to pass: a passing attempt, or a quiz already done. */
export function shouldRevealQuizAnswers(o: { passed: boolean; alreadyDone: boolean }): boolean {
  return o.passed || o.alreadyDone;
}

export function buildQuizFeedback(perQuestion: { id: string; correct: boolean }[], keyItems: QuizKeyItemLike[], reveal: boolean): QuizFeedback[] {
  return perQuestion.map((p) => {
    const item = keyItems.find((i) => i.questionId === p.id);
    const base: QuizFeedback = { questionId: p.id, correct: p.correct };
    if (!p.correct && item?.reviewModuleId) base.reviewModuleId = item.reviewModuleId;
    if (!reveal) return base;
    return { ...base, correctOptionIds: item?.correct ?? [], explanation: item?.explanation ?? "", reviewModuleId: item?.reviewModuleId };
  });
}

/** Attempts made on the same Dublin calendar day as `now` (calendar, not program day, so a time-skip doesn't reset it). */
export function quizAttemptsToday(attempts: { at: string }[], now: Date = new Date()): number {
  const today = dublinDateString(now);
  return attempts.filter((a) => dublinDateString(new Date(a.at)) === today).length;
}

/** A spaced-repetition item can be answered or marked done only on or after its due day. */
export function isReviewDue(item: { dueDay: number }, programDay: number): boolean {
  return item.dueDay <= programDay;
}

/** Shadow-log checklist items that don't yet have a shadow_logs row for this interaction. */
export function newShadowLogItems<T extends { id: string; title: string }>(
  newlyChecked: string[],
  items: T[],
  existingLogs: { interaction: string }[],
): T[] {
  const logged = new Set(existingLogs.map((l) => l.interaction));
  const out: T[] = [];
  for (const id of newlyChecked) {
    const item = items.find((i) => i.id === id);
    if (item && !logged.has(item.title)) {
      out.push(item);
      logged.add(item.title);
    }
  }
  return out;
}
