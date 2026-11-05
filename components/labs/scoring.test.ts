import { describe, expect, it } from "vitest";
import { signatureStory } from "@/content/labs/signature-story";
import { combinedLabScore, evaluateStoryPath, phishingView, redlineNote, scoreDrillAnswers, scorePhishing, shuffleDrillOptions, withBestScore } from "./scoring";

describe("evaluateStoryPath", () => {
  it("scores the good ending 100", () => {
    const r = evaluateStoryPath(signatureStory, ["start-b", "pushback-b", "check-auth-a", "scope-surprise-a"]);
    expect(r).toMatchObject({ valid: true, endingKind: "good", score: 100 });
    expect(r.nodeIds.at(-1)).toBe("end-signed");
  });
  it("scores mixed and bad endings 0", () => {
    expect(evaluateStoryPath(signatureStory, ["start-a", "night-a"])).toMatchObject({ valid: true, endingKind: "mixed", score: 0 });
    expect(evaluateStoryPath(signatureStory, ["start-a", "night-b"])).toMatchObject({ valid: true, endingKind: "bad", score: 0 });
  });
  it("rejects skipped, foreign or unfinished paths", () => {
    expect(evaluateStoryPath(signatureStory, ["scope-surprise-a"]).valid).toBe(false);
    expect(evaluateStoryPath(signatureStory, ["start-b", "pushback-b"]).valid).toBe(false);
    expect(evaluateStoryPath(signatureStory, []).valid).toBe(false);
    expect(evaluateStoryPath(signatureStory, Array(50).fill("start-b")).valid).toBe(false);
  });
});

describe("scoreDrillAnswers", () => {
  const keys = [
    { drillId: "a", correctOptionId: "x" },
    { drillId: "b", correctOptionId: "y" },
    { drillId: "c", correctOptionId: "z" },
    { drillId: "d", correctOptionId: "x" },
  ];
  it("counts correct answers and treats unanswered as wrong", () => {
    const r = scoreDrillAnswers({ a: "x", b: "y", c: "x" }, keys);
    expect(r).toMatchObject({ score: 50, correct: 2, total: 4, missedIds: ["c", "d"], unansweredIds: ["d"] });
  });
  it("ignores answers for unknown drills", () => {
    expect(scoreDrillAnswers({ a: "x", zz: "x", b: "y", c: "z", d: "x" }, keys).score).toBe(100);
  });
  it("handles an empty key", () => {
    expect(scoreDrillAnswers({}, []).score).toBe(0);
  });
});

describe("scorePhishing", () => {
  const map = { from: "f1", replyTo: "f2", link: "f3", button: "f3", to: null, sentAt: null };
  const flags = ["f1", "f2", "f3", "f4"];
  it("gives full marks for reporting with every flag found", () => {
    expect(scorePhishing({ hotspots: ["from", "replyTo", "link"], action: "report" }, { ...map, body: "f4" }, flags).score).toBe(88);
    expect(scorePhishing({ hotspots: ["from", "replyTo", "link", "body"], action: "report" }, { ...map, body: "f4" }, flags).score).toBe(100);
  });
  it("counts a flag once even if two hotspots reveal it", () => {
    const r = scorePhishing({ hotspots: ["link", "button", "link"], action: "report" }, map, flags);
    expect(r.foundFlagIds).toEqual(["f3"]);
    expect(r.score).toBe(63);
  });
  it("penalises false alarms and a wrong action, ignores unknown hotspots", () => {
    const r = scorePhishing({ hotspots: ["from", "to", "sentAt", "nope"], action: "click" }, map, flags);
    expect(r).toMatchObject({ actionCorrect: false, falseAlarms: ["to", "sentAt"], missedFlagIds: ["f2", "f3", "f4"] });
    expect(r.score).toBe(3);
  });
  it("never goes below 0", () => {
    expect(scorePhishing({ hotspots: ["to", "sentAt"], action: "reply" }, map, flags).score).toBe(0);
  });
});

describe("multi-item labs", () => {
  it("keeps the best score per item", () => {
    let best = withBestScore(undefined, "a", 60);
    best = withBestScore(best, "a", 40);
    best = withBestScore(best, "b", 140);
    expect(best).toEqual({ a: 60, b: 100 });
  });
  it("combines only once enough known items are graded", () => {
    expect(combinedLabScore({ a: 80 }, ["a", "b", "c"])).toBeNull();
    expect(combinedLabScore({ a: 80, b: 60, c: 71 }, ["a", "b", "c"])).toBe(70);
    expect(combinedLabScore({ a: 80, x: 0 }, ["a", "b"], 1)).toBe(80);
    expect(combinedLabScore({}, ["a"], 0)).toBeNull();
  });
  it("spells out escalation in the redline note within the cap", () => {
    expect(redlineNote("  Unlimited liability ", true)).toBe("Unlimited liability Escalate to legal review.");
    expect(redlineNote("ok", false)).toBe("ok");
    expect(redlineNote("x".repeat(700), true).length).toBe(600);
  });
});

describe("phishingView (reveal rule)", () => {
  const key = {
    redFlags: [
      { id: "f1", where: "sender", description: "Look-alike domain" },
      { id: "f2", where: "link", description: "Link goes elsewhere" },
      { id: "f3", where: "tone", description: "Urgent threat" },
    ],
    correctAction: "Report it with the Report Phish button.",
  };
  const map = { from: "f1", link: "f2", body: "f3", to: null };
  const ids = ["f1", "f2", "f3"];

  it("a wrong action returns counts only: no flags, no correct action", () => {
    const v = phishingView(scorePhishing({ hotspots: ["from", "to"], action: "delete" }, map, ids), key, { passed: false, taskDone: false });
    expect(v).toMatchObject({ actionCorrect: false, foundCount: 1, missedCount: 2, falseAlarmCount: 1, reveal: null });
    const json = JSON.stringify(v);
    for (const leak of ["Look-alike", "Link goes", "Urgent", "Report it", "f1", "f2", "f3"]) expect(json).not.toContain(leak);
  });

  it("the right action without a passing task still reveals nothing", () => {
    const v = phishingView(scorePhishing({ hotspots: [], action: "report" }, map, ids), key, { passed: false, taskDone: false });
    expect(v.reveal).toBeNull();
  });

  it("a pass reveals every flag (found or missed) and the correct action", () => {
    const v = phishingView(scorePhishing({ hotspots: ["from"], action: "report" }, map, ids), key, { passed: true, taskDone: false });
    expect(v.reveal?.correctAction).toBe(key.correctAction);
    expect(v.reveal?.flags.map((f) => [f.id, f.found])).toEqual([["f1", true], ["f2", false], ["f3", false]]);
  });

  it("once the task is done, even a wrong practice action reveals the answer", () => {
    const v = phishingView(scorePhishing({ hotspots: [], action: "click" }, map, ids), key, { passed: false, taskDone: true });
    expect(v.reveal?.flags).toHaveLength(3);
  });
});

describe("shuffleDrillOptions", () => {
  const drills = Array.from({ length: 12 }, (_, i) => ({ id: `d${i}`, scenario: "s", options: ["a", "b", "c", "d"].map((o) => ({ id: `${i}${o}`, text: o })) }));
  const order = (ds: typeof drills) => ds.map((d) => d.options.map((o) => o.id).join(",")).join("|");

  it("is deterministic for a seed and keeps every option", () => {
    const a = shuffleDrillOptions(drills, "hire:1");
    expect(order(a)).toBe(order(shuffleDrillOptions(drills, "hire:1")));
    a.forEach((d, i) => expect([...d.options].map((o) => o.id).sort()).toEqual(drills[i].options.map((o) => o.id)));
  });

  it("changes the order between attempts and does not mutate the input", () => {
    const before = order(drills);
    expect(order(shuffleDrillOptions(drills, "hire:1"))).not.toBe(order(shuffleDrillOptions(drills, "hire:2")));
    expect(order(drills)).toBe(before);
  });
});
