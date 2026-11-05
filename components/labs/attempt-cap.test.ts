import { describe, expect, it } from "vitest";
import { attemptCapMessage, attemptsUsed, countOnDay, DAILY_ATTEMPT_CAP, takeAttempt, utcDayKey } from "./attempt-cap";

describe("daily attempt cap", () => {
  const day = "2026-11-05";

  it("uses the UTC calendar day", () => {
    expect(utcDayKey(new Date("2026-11-05T23:59:59.000Z"))).toBe("2026-11-05");
    expect(utcDayKey(new Date("2026-11-06T00:00:00.000Z"))).toBe("2026-11-06");
  });

  it("starts at zero for a missing, malformed or old counter", () => {
    for (const v of [undefined, null, "x", 3, {}, { day, count: "5" }, { day, count: -2 }, { day: "2026-11-04", count: 19 }]) expect(attemptsUsed(v, day)).toBe(0);
    expect(attemptsUsed({ day, count: 7 }, day)).toBe(7);
  });

  it("allows exactly the cap, then refuses until the next day", () => {
    let stored: unknown = undefined;
    for (let i = 1; i <= DAILY_ATTEMPT_CAP; i++) {
      const t = takeAttempt(stored, day);
      expect(t).toEqual({ ok: true, next: { day, count: i } });
      if (t.ok) stored = t.next;
    }
    expect(takeAttempt(stored, day)).toEqual({ ok: false });
    expect(takeAttempt(stored, "2026-11-06")).toEqual({ ok: true, next: { day: "2026-11-06", count: 1 } });
  });

  it("supports a custom cap", () => {
    expect(takeAttempt({ day, count: 2 }, day, 3).ok).toBe(true);
    expect(takeAttempt({ day, count: 3 }, day, 3).ok).toBe(false);
  });

  it("counts rows on a given day", () => {
    const rows = [{ at: "2026-11-05T01:00:00.000Z" }, { at: "2026-11-05T23:00:00+00:00" }, { at: "2026-11-04T23:59:00.000Z" }];
    expect(countOnDay(rows, day)).toBe(2);
  });

  it("has a friendly message naming the cap", () => {
    expect(attemptCapMessage()).toContain(String(DAILY_ATTEMPT_CAP));
    expect(attemptCapMessage()).toMatch(/tomorrow/);
  });
});
