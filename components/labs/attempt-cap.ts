// Daily attempt caps for the lab and walkthrough server actions (security L4: bounded writes).
// Pure and framework-free so the rules are unit-tested; the actions persist the counter.
//
// The cap is per calendar day in UTC, not per programme day: it's a write limit, not a journey
// rule, so the demo time-skip must not reset it.

export const DAILY_ATTEMPT_CAP = 20;

export const attemptCapMessage = (cap: number = DAILY_ATTEMPT_CAP) =>
  `You've used today's ${cap} attempts for this task. Your progress is saved, so take a break and come back tomorrow.`;

export interface AttemptCounter {
  /** UTC calendar day, YYYY-MM-DD. */
  day: string;
  count: number;
}

export const utcDayKey = (now: Date = new Date()) => now.toISOString().slice(0, 10);

/** Attempts already used on `day`, from a stored counter (anything malformed or from another day counts as 0). */
export function attemptsUsed(stored: unknown, day: string): number {
  if (!stored || typeof stored !== "object") return 0;
  const { day: d, count } = stored as Partial<AttemptCounter>;
  return d === day && typeof count === "number" && Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

/** Takes one attempt. Refused once `cap` attempts were used today; otherwise returns the counter to store. */
export function takeAttempt(stored: unknown, day: string, cap: number = DAILY_ATTEMPT_CAP): { ok: true; next: AttemptCounter } | { ok: false } {
  const used = attemptsUsed(stored, day);
  return used >= cap ? { ok: false } : { ok: true, next: { day, count: used + 1 } };
}

/** How many runs (with an ISO `at`) fall on the given UTC day. */
export function countOnDay(rows: readonly { at: string }[], day: string): number {
  return rows.filter((r) => typeof r.at === "string" && r.at.slice(0, 10) === day).length;
}
