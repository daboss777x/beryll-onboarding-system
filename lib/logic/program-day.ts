/**
 * Program day maths. Calendar days are Europe/Dublin days (DST safe).
 *
 * API
 *  - dublinDateString(d): "YYYY-MM-DD" of the Dublin calendar day containing d
 *  - getProgramDay(profile, now): number  (0 = pre-boarding, 1 = start date) + demoDayOffset, never < 0
 *  - stageForDay(stages, day): StageDef | undefined  (stage whose [startDay, endDay] contains day)
 */
import type { Profile, StageDef } from "../types";

const TZ = "Europe/Dublin";
const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dublinDateString(d: Date): string {
  return fmt.format(d);
}

function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** A bare "YYYY-MM-DD" is taken as a Dublin calendar date; a full ISO timestamp is converted to its Dublin date. */
function toDublinDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : dublinDateString(new Date(iso));
}

export function getProgramDay(profile: Pick<Profile, "startDate" | "demoDayOffset">, now: Date): number {
  const diff = dayNumber(dublinDateString(now)) - dayNumber(toDublinDate(profile.startDate));
  const base = diff >= 0 ? diff + 1 : 0;
  return Math.max(0, base + (profile.demoDayOffset ?? 0));
}

export function stageForDay(stages: readonly StageDef[], day: number): StageDef | undefined {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  // Pre-boarding (day 0) and anything before the first stage maps to the first stage.
  const hit = sorted.find((s) => day >= s.startDay && day <= s.endDay);
  if (hit) return hit;
  if (sorted.length && day < sorted[0].startDay) return sorted[0];
  return undefined;
}
