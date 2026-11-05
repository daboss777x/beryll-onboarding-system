import { describe, expect, it } from "vitest";
import { dublinDateString, getProgramDay, stageForDay } from "./program-day";
import { STAGES } from "./fixtures";

const p = (startDate: string, demoDayOffset = 0) => ({ startDate, demoDayOffset });

describe("getProgramDay", () => {
  it("is 0 before the start date", () => {
    expect(getProgramDay(p("2026-11-09"), new Date("2026-11-08T12:00:00Z"))).toBe(0);
    expect(getProgramDay(p("2026-11-09"), new Date("2026-01-01T12:00:00Z"))).toBe(0);
  });
  it("is 1 on the start date and counts up", () => {
    expect(getProgramDay(p("2026-11-09"), new Date("2026-11-09T09:00:00Z"))).toBe(1);
    expect(getProgramDay(p("2026-11-09"), new Date("2026-11-10T09:00:00Z"))).toBe(2);
    expect(getProgramDay(p("2026-11-09"), new Date("2027-02-06T09:00:00Z"))).toBe(90);
  });
  it("applies demoDayOffset, never below 0", () => {
    expect(getProgramDay(p("2026-11-09", 29), new Date("2026-11-09T09:00:00Z"))).toBe(30);
    expect(getProgramDay(p("2026-11-09", 10), new Date("2026-10-01T09:00:00Z"))).toBe(10);
    expect(getProgramDay(p("2026-11-09", -5), new Date("2026-11-10T09:00:00Z"))).toBe(0);
  });
  it("uses Dublin calendar days in summer (BST = UTC+1)", () => {
    // 23:30 UTC on 8 Jun is already 9 Jun 00:30 in Dublin
    expect(dublinDateString(new Date("2026-06-08T23:30:00Z"))).toBe("2026-06-09");
    expect(getProgramDay(p("2026-06-09"), new Date("2026-06-08T23:30:00Z"))).toBe(1);
    expect(getProgramDay(p("2026-06-09"), new Date("2026-06-08T22:30:00Z"))).toBe(0);
  });
  it("uses Dublin calendar days in winter (GMT)", () => {
    expect(getProgramDay(p("2026-12-01"), new Date("2026-12-01T00:30:00Z"))).toBe(1);
    expect(getProgramDay(p("2026-12-01"), new Date("2026-11-30T23:59:00Z"))).toBe(0);
  });
  it("is DST-transition safe", () => {
    // clocks go forward 29 Mar 2026; start 27 Mar -> 31 Mar is day 5
    expect(getProgramDay(p("2026-03-27"), new Date("2026-03-31T12:00:00Z"))).toBe(5);
    // clocks go back 25 Oct 2026
    expect(getProgramDay(p("2026-10-24"), new Date("2026-10-27T12:00:00Z"))).toBe(4);
  });
  it("accepts a full ISO timestamp start date (converted to Dublin day)", () => {
    expect(getProgramDay(p("2026-06-08T23:30:00Z"), new Date("2026-06-09T10:00:00Z"))).toBe(1);
  });
});

describe("stageForDay", () => {
  it("finds the containing stage", () => {
    expect(stageForDay(STAGES, 1)?.id).toBe("day1");
    expect(stageForDay(STAGES, 7)?.id).toBe("weeks1-2");
    expect(stageForDay(STAGES, 8)?.id).toBe("days8-30");
    expect(stageForDay(STAGES, 90)?.id).toBe("days61-90");
    expect(stageForDay(STAGES, 200)?.id).toBe("months4-12");
  });
  it("maps day 0 to pre-boarding and beyond-the-end to undefined", () => {
    expect(stageForDay(STAGES, 0)?.id).toBe("preboarding");
    expect(stageForDay(STAGES, 400)).toBeUndefined();
  });
  it("does not depend on input order", () => {
    expect(stageForDay([...STAGES].reverse(), 20)?.id).toBe("days8-30");
  });
});
