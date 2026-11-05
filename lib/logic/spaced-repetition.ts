/**
 * Spaced repetition for missed quiz items: reviews come back +3, +10, +30 program days after the miss.
 *  - scheduleReviews(itemId, missedOnDay): ReviewItem[]  (3 items)
 *  - mergeReviews(queue, newItems): queue without duplicate (itemId, interval); an existing entry is kept
 *  - completeReview(queue, itemId, interval, day): marks that review done
 *  - dueItems(queue, programDay): not-completed reviews with dueDay <= programDay, oldest first
 */
export const REVIEW_INTERVALS = [3, 10, 30] as const;

export interface ReviewItem {
  itemId: string;
  interval: number;
  dueDay: number;
  missedOnDay: number;
  completedDay?: number;
}

export function scheduleReviews(itemId: string, missedOnDay: number): ReviewItem[] {
  return REVIEW_INTERVALS.map((interval) => ({ itemId, interval, missedOnDay, dueDay: missedOnDay + interval }));
}

export function mergeReviews(queue: readonly ReviewItem[], incoming: readonly ReviewItem[]): ReviewItem[] {
  const out = [...queue];
  for (const r of incoming) {
    if (!out.some((q) => q.itemId === r.itemId && q.interval === r.interval)) out.push(r);
  }
  return out;
}

export function completeReview(queue: readonly ReviewItem[], itemId: string, interval: number, day: number): ReviewItem[] {
  return queue.map((q) => (q.itemId === itemId && q.interval === interval ? { ...q, completedDay: day } : q));
}

export function dueItems(queue: readonly ReviewItem[], programDay: number): ReviewItem[] {
  return queue
    .filter((q) => q.completedDay === undefined && q.dueDay <= programDay)
    .sort((a, b) => a.dueDay - b.dueDay || a.itemId.localeCompare(b.itemId));
}
