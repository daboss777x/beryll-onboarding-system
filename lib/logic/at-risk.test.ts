import { describe, expect, it } from "vitest";
import { riskFlags } from "./at-risk";
import { STAGES } from "./fixtures";
import type { CheckIn, Pulse } from "../types";

const hire = { id: "h1", name: "Aoife Byrne" };
const ok = { failed: 0, passed: false };
const run = (o: Partial<{ pulses: Pulse[]; checkins: CheckIn[]; st: Record<string, "locked" | "active" | "done">; cert: { failed: number; passed: boolean }; last: number | null; day: number }> = {}) =>
  riskFlags(hire, o.pulses ?? [], o.checkins ?? [], (o.st ?? {}) as never, o.cert ?? ok, o.last === undefined ? 10 : o.last, o.day ?? 10, STAGES);
const pulse = (c: number, f: number, b: number, hireId = "h1"): Pulse => ({ hireId, day: 7, clarity: c, confidence: f, belonging: b, submittedAt: "x" });
const ci = (dueDay: number, extra: Partial<CheckIn> = {}): CheckIn => ({ id: `c${dueDay}`, hireId: "h1", dueDay, label: `Day ${dueDay}`, ...extra });

describe("riskFlags", () => {
  it("returns nothing for a healthy hire", () => expect(run({ pulses: [pulse(4, 4, 5)] })).toEqual([]));
  it("low pulse at exactly 2, not at 3", () => {
    const f = run({ pulses: [pulse(3, 2, 5)] });
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({ hireId: "h1", reason: "low_pulse" });
    expect(f[0].detail).toContain("confidence 2/5");
    expect(f[0].suggestedAction).toContain("Aoife");
    expect(run({ pulses: [pulse(3, 3, 3)] })).toEqual([]);
  });
  it("ignores other hires' pulses and check-ins", () => {
    expect(run({ pulses: [pulse(1, 1, 1, "h2")], checkins: [ci(1, { hireId: "h2" })], day: 20, last: 20 })).toEqual([]);
  });
  it("overdue check-in only when MORE than 3 days late and not held", () => {
    expect(run({ checkins: [ci(7)], day: 10 })).toEqual([]);
    expect(run({ checkins: [ci(7)], day: 11 })[0]?.reason).toBe("overdue_checkin");
    expect(run({ checkins: [ci(7, { heldAt: "x" })], day: 20, last: 20 })).toEqual([]);
    expect(run({ checkins: [ci(1), ci(7)], day: 11 })[0].detail).toContain("2 overdue");
  });
  it("stalled stage past endDay + 5, only if active", () => {
    const st = { "weeks1-2": "active" as const };
    expect(run({ st, day: 12, last: 12 })).toEqual([]); // endDay 7 + 5 = 12, not beyond
    expect(run({ st, day: 13, last: 13 })[0]).toMatchObject({ reason: "stalled_stage" });
    expect(run({ st: { "weeks1-2": "done" }, day: 20, last: 20 })).toEqual([]);
  });
  it("certification failed twice and not later passed", () => {
    expect(run({ cert: { failed: 1, passed: false } })).toEqual([]);
    expect(run({ cert: { failed: 2, passed: false } })[0].reason).toBe("failed_certification_twice");
    expect(run({ cert: { failed: 2, passed: true } })).toEqual([]);
  });
  it("inactive at 5 program days, not 4; null counts as day 0; skipped pre-boarding", () => {
    expect(run({ last: 6, day: 10 })).toEqual([]);
    expect(run({ last: 5, day: 10 })[0].reason).toBe("inactive");
    expect(run({ last: null, day: 5 })[0].reason).toBe("inactive");
    expect(run({ last: null, day: 4 })).toEqual([]);
    expect(run({ last: null, day: 0 })).toEqual([]);
  });
  it("can raise several flags at once", () => {
    const f = run({ pulses: [pulse(1, 4, 4)], cert: { failed: 3, passed: false }, last: 1, day: 10 });
    expect(f.map((x) => x.reason)).toEqual(["low_pulse", "failed_certification_twice", "inactive"]);
    expect(f.every((x) => x.detail && x.suggestedAction)).toBe(true);
  });
});
