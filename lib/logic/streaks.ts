/**
 * Streak = consecutive program days (>=1) with at least one completed task, ending today.
 * If today has no activity yet the streak is still alive when yesterday had some (grace);
 * it resets to 0 once a full program day has been missed.
 *  - currentStreak(activityDays, programDay)
 *  - longestStreak(activityDays)
 */
function clean(days: readonly number[]): number[] {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 1))].sort((a, b) => a - b);
}

export function currentStreak(activityDays: readonly number[], programDay: number): number {
  const set = new Set(clean(activityDays).filter((d) => d <= programDay));
  let d = set.has(programDay) ? programDay : programDay - 1;
  let n = 0;
  while (d >= 1 && set.has(d)) {
    n++;
    d--;
  }
  return n;
}

export function longestStreak(activityDays: readonly number[]): number {
  const days = clean(activityDays);
  let best = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && d === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}
