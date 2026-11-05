/**
 * Check-in schedule and pulse timing.
 *  - CHECKIN_DAYS: 1, 7, every 14 days (14..84), plus 30/60/90 (deduped, sorted)
 *  - defaultCheckins(hireId): CheckIn[] with stable ids `${hireId}-checkin-d${day}` and labels
 *  - PULSE_DAYS = [7, 30, 90]
 *  - duePulse(programDay, submitted): earliest pulse day <= programDay not in `submitted`, else null
 */
import type { CheckIn } from "../types";

export const PULSE_DAYS = [7, 30, 90] as const;
export type PulseDay = (typeof PULSE_DAYS)[number];

function buildDays(): number[] {
  const s = new Set<number>([1, 7, 30, 60, 90]);
  for (let d = 14; d <= 90; d += 14) s.add(d);
  return [...s].sort((a, b) => a - b);
}
export const CHECKIN_DAYS: readonly number[] = buildDays();

export function checkinLabel(day: number): string {
  if ([1, 30, 60, 90].includes(day)) return `Day ${day}`;
  if (day % 7 === 0) return `Week ${day / 7}`;
  return `Day ${day}`;
}

export function defaultCheckins(hireId: string): CheckIn[] {
  return CHECKIN_DAYS.map((day) => ({ id: `${hireId}-checkin-d${day}`, hireId, dueDay: day, label: checkinLabel(day) }));
}

export function duePulse(programDay: number, submitted: readonly number[]): PulseDay | null {
  return PULSE_DAYS.find((d) => programDay >= d && !submitted.includes(d)) ?? null;
}
