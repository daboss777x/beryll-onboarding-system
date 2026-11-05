import { describe, expect, it } from "vitest";
import { computeStageStatuses, computeTaskStatuses, isCertificationPassed } from "./unlocks";
import { prog, STAGES, TASKS } from "./fixtures";

const doneUpTo = (...ids: string[]) => ids.map((i) => prog(i));

describe("computeStageStatuses", () => {
  it("starts with only pre-boarding active at day 0", () => {
    const s = computeStageStatuses(STAGES, TASKS, [], 0);
    expect(s.preboarding).toBe("active");
    expect(s.day1).toBe("locked");
  });
  it("needs both the day and the previous stage done", () => {
    expect(computeStageStatuses(STAGES, TASKS, doneUpTo("pre-check"), 0).day1).toBe("locked"); // day not reached
    expect(computeStageStatuses(STAGES, TASKS, [], 1).day1).toBe("locked"); // previous not done
    const s = computeStageStatuses(STAGES, TASKS, doneUpTo("pre-check"), 1);
    expect(s.preboarding).toBe("done");
    expect(s.day1).toBe("active");
  });
  it("ignores optional tasks for stage completion", () => {
    const s = computeStageStatuses(STAGES, TASKS, doneUpTo("pre-check", "d1-story", "w-quiz"), 5);
    expect(s["weeks1-2"]).toBe("done");
    expect(s["days8-30"]).toBe("locked"); // day 8 not reached
    expect(computeStageStatuses(STAGES, TASKS, doneUpTo("pre-check", "d1-story", "w-quiz"), 8)["days8-30"]).toBe("active");
  });
  it("light stages need certification AND day", () => {
    const base = ["pre-check", "d1-story", "w-quiz", "m-redline", "m-late"];
    expect(computeStageStatuses(STAGES, TASKS, doneUpTo(...base), 40)["days31-60"]).toBe("locked");
    const s = computeStageStatuses(STAGES, TASKS, doneUpTo(...base, "m-cert"), 31);
    expect(s["days8-30"]).toBe("done");
    expect(s["days31-60"]).toBe("active");
    expect(computeStageStatuses(STAGES, TASKS, doneUpTo(...base, "m-cert"), 30)["days31-60"]).toBe("locked");
  });
  it("days61-90 needs days31-60 done; months4-12 never done (no required tasks)", () => {
    const all = ["pre-check", "d1-story", "w-quiz", "m-redline", "m-late", "m-cert", "l-mission", "s-review"];
    const s = computeStageStatuses(STAGES, TASKS, doneUpTo(...all), 95);
    expect(s["days61-90"]).toBe("done");
    expect(s["months4-12"]).toBe("active");
  });
  it("is robust to unsorted stages and failed rows", () => {
    const s = computeStageStatuses([...STAGES].reverse(), TASKS, [prog("pre-check", "failed")], 1);
    expect(s.preboarding).toBe("active");
  });
});

describe("computeTaskStatuses", () => {
  it("locks tasks in locked stages and opens those in the active stage", () => {
    const t = computeTaskStatuses(STAGES, TASKS, [], 0);
    expect(t["pre-check"]).toBe("available");
    expect(t["d1-story"]).toBe("locked");
  });
  it("respects unlockDay", () => {
    const base = ["pre-check", "d1-story", "w-quiz"];
    expect(computeTaskStatuses(STAGES, TASKS, doneUpTo(...base), 10)["m-late"]).toBe("locked");
    expect(computeTaskStatuses(STAGES, TASKS, doneUpTo(...base), 12)["m-late"]).toBe("available");
  });
  it("keeps done, in_progress and failed", () => {
    const t = computeTaskStatuses(STAGES, TASKS, [prog("pre-check"), prog("d1-story", "in_progress"), prog("w-quiz", "failed")], 2);
    expect(t["pre-check"]).toBe("done");
    expect(t["d1-story"]).toBe("in_progress");
    expect(t["w-quiz"]).toBe("locked"); // stage not active yet, stored status doesn't leak
  });
  it("a done row beats later non-done duplicates", () => {
    const t = computeTaskStatuses(STAGES, TASKS, [prog("pre-check"), prog("pre-check", "failed")], 0);
    expect(t["pre-check"]).toBe("done");
  });
  it("certification needs every other required task in its stage", () => {
    const base = ["pre-check", "d1-story", "w-quiz"];
    expect(computeTaskStatuses(STAGES, TASKS, doneUpTo(...base, "m-redline"), 15)["m-cert"]).toBe("locked");
    expect(computeTaskStatuses(STAGES, TASKS, doneUpTo(...base, "m-redline", "m-late"), 15)["m-cert"]).toBe("available");
  });
  it("a failed certification can be retried (status failed)", () => {
    const base = ["pre-check", "d1-story", "w-quiz", "m-redline", "m-late"];
    const t = computeTaskStatuses(STAGES, TASKS, [...doneUpTo(...base), prog("m-cert", "failed", { attempts: 2 })], 20);
    expect(t["m-cert"]).toBe("failed");
  });
  it("light-stage tasks stay locked until certified", () => {
    expect(computeTaskStatuses(STAGES, TASKS, [], 40)["l-mission"]).toBe("locked");
  });
});

describe("isCertificationPassed", () => {
  it("is false with no cert task or not done", () => {
    expect(isCertificationPassed([], [])).toBe(false);
    expect(isCertificationPassed(TASKS, [prog("m-cert", "failed")])).toBe(false);
    expect(isCertificationPassed(TASKS, [prog("m-cert")])).toBe(true);
  });
});

describe("certification vs pulse (real content)", () => {
  it("d30-certification is available on day 22 once other required tasks are done, even though d30-pulse unlocks on day 30", async () => {
    const { tasks, stages } = await import("../../content");
    const done = tasks
      .filter((t) => t.required && t.id !== "d30-pulse" && t.kind !== "certification" && stages.findIndex((s) => s.id === t.stageId) <= stages.findIndex((s) => s.id === "days8-30"))
      .map((t) => prog(t.id));
    const statuses = computeTaskStatuses(stages, tasks, done, 22);
    expect(statuses["d30-certification"]).toBe("available");
    expect(statuses["d30-pulse"]).toBe("locked");
  });
});
