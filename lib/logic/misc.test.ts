import { describe, expect, it } from "vitest";
import { levelFromXp, totalXp, xpForLevel, xpForTask } from "./xp";
import { rankFor } from "./ranks";
import { currentStreak, longestStreak } from "./streaks";
import { dueItems, scheduleReviews, completeReview, mergeReviews } from "./spaced-repetition";
import { CHECKIN_DAYS, defaultCheckins, duePulse, PULSE_DAYS } from "./checkins";
import { evaluateTrophies, TROPHY_DEFS, TROPHY_TASK_MAP, type TrophyState } from "./trophies";

describe("xp", () => {
  const ev = (amount: number, source = "a", at = "t1") => ({ hireId: "h", source, amount, at });
  it("sums and dedupes exact duplicates, ignores bad amounts", () => {
    expect(totalXp([])).toBe(0);
    expect(totalXp([ev(10), ev(10), ev(10, "b"), ev(-5, "c"), ev(NaN, "d"), ev(0, "e")])).toBe(20);
    expect(totalXp([ev(10, "a", "t1"), ev(10, "a", "t2")])).toBe(20);
  });
  it("level curve", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForNext: 100, progress: 0 });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(250)).toMatchObject({ level: 2, xpIntoLevel: 150, xpForNext: 200, progress: 0.75 });
    expect(levelFromXp(-5).level).toBe(1);
  });
  it("xpForTask", () => {
    const scored = { xp: 40, passScore: 80 };
    expect(xpForTask(scored, 80)).toBe(40);
    expect(xpForTask(scored, 79)).toBe(10);
    expect(xpForTask(scored, undefined)).toBe(10);
    expect(xpForTask({ xp: 30 }, undefined)).toBe(30);
    expect(xpForTask(scored, 90, 40)).toBe(0); // re-pass
    expect(xpForTask(scored, 90, 10)).toBe(30); // pass after earlier fail credit
    expect(xpForTask(scored, 10, 10)).toBe(0); // second fail adds nothing
  });
});

describe("rankFor", () => {
  it("climbs the ladder", () => {
    expect(rankFor({}, false, false)).toBe("observer");
    expect(rankFor({ "weeks1-2": "active" }, false, false)).toBe("observer");
    expect(rankFor({ "weeks1-2": "done" }, false, false)).toBe("copilot");
    expect(rankFor({ "weeks1-2": "done" }, true, false)).toBe("solo");
    expect(rankFor({}, true, false)).toBe("solo");
    expect(rankFor({ "weeks1-2": "done" }, true, true)).toBe("independent");
  });
  it("ignores sign-off without certification", () => {
    expect(rankFor({ "weeks1-2": "done" }, false, true)).toBe("copilot");
  });
});

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak([3, 4, 5], 5)).toBe(3);
    expect(currentStreak([1, 2, 4, 5], 5)).toBe(2);
  });
  it("grace for today without activity, resets after a missed day", () => {
    expect(currentStreak([3, 4], 5)).toBe(2);
    expect(currentStreak([3, 4], 6)).toBe(0);
  });
  it("handles duplicates, empties, day 0 and future days", () => {
    expect(currentStreak([], 5)).toBe(0);
    expect(currentStreak([5, 5, 4, 4], 5)).toBe(2);
    expect(currentStreak([0, 1], 1)).toBe(1);
    expect(currentStreak([6, 7], 5)).toBe(0);
  });
  it("longest streak", () => {
    expect(longestStreak([1, 2, 3, 7, 8, 9, 10, 10])).toBe(4);
    expect(longestStreak([])).toBe(0);
  });
});

describe("spaced repetition", () => {
  it("schedules +3, +10, +30", () => {
    const r = scheduleReviews("q1", 5);
    expect(r.map((x) => x.dueDay)).toEqual([8, 15, 35]);
    expect(r.every((x) => x.itemId === "q1" && x.missedOnDay === 5)).toBe(true);
  });
  it("dueItems filters by day, sorts and skips completed", () => {
    let q = [...scheduleReviews("b", 5), ...scheduleReviews("a", 1)];
    expect(dueItems(q, 3)).toEqual([]);
    expect(dueItems(q, 8).map((x) => `${x.itemId}${x.dueDay}`)).toEqual(["a4", "b8"]);
    q = completeReview(q, "a", 3, 4);
    expect(dueItems(q, 8).map((x) => x.itemId)).toEqual(["b"]);
    expect(dueItems(q, 100)).toHaveLength(5);
  });
  it("mergeReviews dedupes", () => {
    const q = scheduleReviews("a", 1);
    expect(mergeReviews(q, scheduleReviews("a", 20))).toHaveLength(3);
    expect(mergeReviews(q, scheduleReviews("b", 1))).toHaveLength(6);
  });
});

describe("checkins", () => {
  it("creates the expected deduped schedule", () => {
    expect(CHECKIN_DAYS).toEqual([1, 7, 14, 28, 30, 42, 56, 60, 70, 84, 90]);
    const c = defaultCheckins("h1");
    expect(c.map((x) => x.dueDay)).toEqual([...CHECKIN_DAYS]);
    expect(new Set(c.map((x) => x.id)).size).toBe(c.length);
    expect(c.find((x) => x.dueDay === 1)?.label).toBe("Day 1");
    expect(c.find((x) => x.dueDay === 7)?.label).toBe("Week 1");
    expect(c.find((x) => x.dueDay === 30)?.label).toBe("Day 30");
    expect(c.find((x) => x.dueDay === 90)?.label).toBe("Day 90");
    expect(c.every((x) => x.hireId === "h1" && !x.heldAt)).toBe(true);
  });
  it("pulse days and duePulse", () => {
    expect([...PULSE_DAYS]).toEqual([7, 30, 90]);
    expect(duePulse(6, [])).toBeNull();
    expect(duePulse(7, [])).toBe(7);
    expect(duePulse(7, [7])).toBeNull();
    expect(duePulse(40, [])).toBe(7); // earliest missed first
    expect(duePulse(40, [7])).toBe(30);
    expect(duePulse(95, [7, 30])).toBe(90);
    expect(duePulse(95, [7, 30, 90])).toBeNull();
  });
});

describe("trophies", () => {
  const empty: TrophyState = { completedTaskIds: [], questsConfirmed: 0, shadowLogs: 0, streak: 0, kudosGiven: 0, certificationPassed: false, day90SignedOff: false };
  it("has ~15 unique defs", () => {
    expect(TROPHY_DEFS).toHaveLength(15);
    expect(new Set(TROPHY_DEFS.map((t) => t.id)).size).toBe(15);
  });
  it("earns nothing from empty state", () => expect(evaluateTrophies(empty)).toEqual([]));
  it("first steps on any task", () => expect(evaluateTrophies({ ...empty, completedTaskIds: ["whatever"] })).toEqual(["first-steps"]));
  it("task, threshold and flag trophies", () => {
    const all = Object.values(TROPHY_TASK_MAP).flat();
    const ids = evaluateTrophies({ completedTaskIds: all, questsConfirmed: 3, shadowLogs: 5, streak: 5, kudosGiven: 1, certificationPassed: true, day90SignedOff: true });
    expect(ids).toEqual(TROPHY_DEFS.map((t) => t.id));
  });
  it("thresholds are exact", () => {
    expect(evaluateTrophies({ ...empty, questsConfirmed: 2, shadowLogs: 4, streak: 4 })).toEqual([]);
    expect(evaluateTrophies({ ...empty, questsConfirmed: 3 })).toEqual(["connector"]);
    expect(evaluateTrophies({ ...empty, shadowLogs: 5 })).toEqual(["shadow-scholar"]);
    expect(evaluateTrophies({ ...empty, streak: 5 })).toEqual(["streak-5"]);
  });
  it("independent needs certification; custom map works; deterministic", () => {
    expect(evaluateTrophies({ ...empty, day90SignedOff: true })).toEqual([]);
    const s = { ...empty, completedTaskIds: ["x", "x", "y"] };
    expect(evaluateTrophies(s, { "best-self": ["x", "y"] })).toEqual(["first-steps", "best-self"]);
    expect(evaluateTrophies(s, { "best-self": ["x", "z"] })).toEqual(["first-steps"]);
    expect(evaluateTrophies(s)).toEqual(evaluateTrophies(s));
  });
});
