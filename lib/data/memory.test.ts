import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { getProgramDay } from "../logic/program-day";
import { createMemoryRepo, memoryFindUserByEmail } from "./memory";
import type { Repository } from "./repo";
import { buildSeed, type SeedData } from "./seed";
import type { SessionUser } from "./types";
import { DEMO_IDS as ID } from "../../content/demo";

const NOW = new Date("2026-11-04T12:00:00Z");
let state: SeedData;
let session: SessionUser | null;
let repo: Repository;

beforeEach(() => {
  state = buildSeed(NOW);
  session = null;
  repo = createMemoryRepo(state, async () => session);
});

describe("seed", () => {
  it("has the three demo logins, five dummy hires and 12 staff", async () => {
    expect(memoryFindUserByEmail(state, "HIRE@beryll.demo")?.name).toBe("Alex Byrne");
    expect(memoryFindUserByEmail(state, "manager@beryll.demo")?.role).toBe("manager");
    expect(memoryFindUserByEmail(state, "buddy@beryll.demo")?.name).toBe("Marco Rossi");
    const hires = await repo.listHiresForManager(ID.manager);
    expect(hires.map((h) => h.name.split(" ")[0]).sort()).toEqual(["Alex", "Aoife", "Luca", "Nadia", "Sofia", "Tomás"]);
    expect((await repo.listStaff()).length).toBe(12);
  });

  it("puts hires on the intended program days", () => {
    const day = (key: string) => getProgramDay(state.profiles.find((p) => p.id === key)!, NOW);
    expect(day(ID.alex)).toBe(0);
    expect(day(ID.aoife)).toBe(0);
    expect(day(ID.luca)).toBe(9);
    expect(day(ID.sofia)).toBe(22);
    expect(day(ID.tomas)).toBe(45);
    expect(day(ID.nadia)).toBe(78);
  });

  it("makes Nadia at risk: low belonging pulse and a missed check-in", async () => {
    const pulses = await repo.listPulses(ID.nadia);
    expect(pulses.some((p) => p.belonging <= 2)).toBe(true);
    const missed = (await repo.listCheckins(ID.nadia)).find((c) => c.dueDay === 70);
    expect(missed?.heldAt).toBeUndefined();
  });
});

describe("memory repository", () => {
  it("returns the session profile from the injected session", async () => {
    expect(await repo.getSessionProfile()).toBeNull();
    session = { id: ID.alex, role: "hire", email: "hire@beryll.demo" };
    expect((await repo.getSessionProfile())?.name).toBe("Alex Byrne");
  });

  it("returns copies, not live references", async () => {
    const p = (await repo.getProfile(ID.alex))!;
    p.name = "Mutated";
    expect((await repo.getProfile(ID.alex))!.name).toBe("Alex Byrne");
  });

  it("gives the buddy a limited summary of their hire", async () => {
    const s = await repo.getBuddyHire(ID.buddy);
    expect(s).toMatchObject({ hireId: ID.alex, name: "Alex Byrne", questsOpen: 3 });
    expect(s).not.toHaveProperty("email");
    expect(await repo.getBuddyHire(ID.manager)).toBeNull();
  });

  it("upserts task progress and keeps QA fields manager-only", async () => {
    await repo.upsertTaskProgress({ hireId: ID.alex, taskId: "t1", status: "done", attempts: 1, score: 90 });
    await repo.setTaskQa(ID.alex, "t1", 70, "ok");
    await repo.upsertTaskProgress({ hireId: ID.alex, taskId: "t1", status: "done", attempts: 2, score: 95, data: { qaScore: 100 } });
    const t = (await repo.getTaskProgress(ID.alex)).find((x) => x.taskId === "t1")!;
    expect(t.attempts).toBe(2);
    expect(t.data?.qaScore).toBe(70);
  });

  it("dedupes XP events by source and trophies by id", async () => {
    expect(await repo.addXpEvent({ hireId: ID.alex, source: "task:a", amount: 10 })).toBe(true);
    expect(await repo.addXpEvent({ hireId: ID.alex, source: "task:a", amount: 10 })).toBe(false);
    expect((await repo.listXpEvents(ID.alex)).length).toBe(1);
    expect(await repo.awardTrophy(ID.alex, "first-steps")).toBe(true);
    expect(await repo.awardTrophy(ID.alex, "first-steps")).toBe(false);
  });

  it("allows one pulse per day", async () => {
    const p = { hireId: ID.alex, day: 7 as const, clarity: 4, confidence: 4, belonging: 4, submittedAt: NOW.toISOString() };
    await repo.submitPulse(p);
    await expect(repo.submitPulse(p)).rejects.toThrow(/already/);
  });

  it("upserts check-ins by (hire, dueDay)", async () => {
    session = { id: ID.manager, role: "manager", email: "manager@beryll.demo" };
    const before = (await repo.listCheckins(ID.luca)).length;
    const c = await repo.upsertCheckin({ hireId: ID.luca, dueDay: 14, label: "Week 2", heldAt: NOW.toISOString(), notes: "Good" });
    expect((await repo.listCheckins(ID.luca)).length).toBe(before);
    expect(c.id).toBe(`${ID.luca}-checkin-d14`);
    expect(c.notes).toBe("Good");
  });

  it("lets only the buddy or manager confirm a quest", async () => {
    const q = await repo.createQuest({ hireId: ID.alex, type: "meet", title: "Meet Jonas", staffId: "jonas-weber" });
    await expect(repo.confirmQuest(q.id, ID.luca)).rejects.toThrow();
    const done = await repo.confirmQuest(q.id, ID.buddy);
    expect(done.confirmedBy).toBe(ID.buddy);
    expect(done.confirmedAt).toBeTruthy();
  });

  it("runs the contracts sandbox per hire", async () => {
    const c = await repo.createContract(ID.alex, { client: "Acme", type: "NDA", title: "Mutual NDA", clauses: [] });
    expect(c.status).toBe("draft");
    await repo.updateContractClauses(ID.alex, c.id, [{ id: "conf", title: "Confidentiality", body: "..." }]);
    const moved = await repo.moveContractStatus(ID.alex, c.id, "signed");
    expect(moved.clauses).toHaveLength(1);
    expect(moved.status).toBe("signed");
    expect(await repo.getContract(ID.luca, c.id)).toBeNull();
    await expect(repo.moveContractStatus(ID.luca, c.id, "draft")).rejects.toThrow();
    await repo.deleteContract(ID.alex, c.id);
    expect(await repo.getContract(ID.alex, c.id)).toBeNull();
  });

  it("saves and reads certification, matcher, walkthrough and quiz data", async () => {
    await repo.saveCertification({ hireId: ID.alex, stageId: "days8-30", status: "pending", attempts: 1, aiScore: 75 });
    expect((await repo.getCertification(ID.alex))?.aiScore).toBe(75);
    await repo.saveMatcherProfile({ hireId: ID.alex, interests: ["golf"], visibility: { golf: true }, suggestions: [] });
    expect((await repo.getMatcherProfile(ID.alex))?.interests).toEqual(["golf"]);
    await repo.saveWalkthroughRun({ hireId: ID.alex, walkthroughId: "wt-create-sow", mode: "guided", errors: 1, durationMs: 5000, passed: true });
    expect(await repo.listWalkthroughRuns(ID.alex, "wt-create-sow")).toHaveLength(1);
    await repo.addQuizAttempt({ hireId: ID.alex, quizId: "q1", answers: {}, score: 60, missedItemIds: ["i1"] });
    await repo.upsertReviewItem({ hireId: ID.alex, itemId: "i1", quizId: "q1", dueDay: 5, step: 0 });
    expect(await repo.listReviewQueue(ID.alex, 4)).toHaveLength(0);
    expect(await repo.listReviewQueue(ID.alex, 5)).toHaveLength(1);
  });

  it("time-skips demo profiles only", async () => {
    await repo.setDemoDayOffset(ID.alex, 30);
    expect((await repo.getProfile(ID.alex))!.demoDayOffset).toBe(30);
    state.profiles.find((p) => p.id === ID.luca)!.isDemo = false;
    await expect(repo.setDemoDayOffset(ID.luca, 5)).rejects.toThrow();
  });

  it("counts AI usage per user and feature", async () => {
    expect(await repo.incrementAiUsage(ID.alex, "coach")).toBe(1);
    expect(await repo.incrementAiUsage(ID.alex, "coach")).toBe(2);
    expect(await repo.incrementAiUsage(ID.alex, "roleplay")).toBe(1);
    expect(await repo.incrementAiUsage(ID.luca, "coach")).toBe(1);
  });

  it("refuses kudos to yourself", async () => {
    await expect(repo.addKudos(ID.alex, ID.alex, "me")).rejects.toThrow();
    await repo.addKudos(ID.buddy, ID.alex, "Nice one");
    expect((await repo.listKudos(ID.alex)).length).toBe(1);
  });
});

describe("role-play sessions + buddy matcher view (Leah follow-up)", () => {
  it("active sessions are server-held, capped, ended once, and not listed until ended", async () => {
    const s = await repo.createRoleplaySession({ hireId: ID.alex, personaId: "bank-ciso", isCertification: false });
    expect(await repo.listRoleplaySessions(ID.alex)).toEqual([]);
    expect(await repo.getRoleplaySession("someone-else", s.id)).toBeNull();
    expect(await repo.appendRoleplayTurns(ID.alex, s.id, [{ role: "user", content: "a" }], { maxUserTurns: 1 })).not.toBeNull();
    expect(await repo.appendRoleplayTurns(ID.alex, s.id, [{ role: "user", content: "b" }], { maxUserTurns: 1 })).toBeNull();
    const outcome = { rubricScores: [], overall: 40, aiSummary: "x", passed: false, endResponse: { mode: "fallback" } };
    expect((await repo.endRoleplaySession(ID.alex, s.id, outcome))?.status).toBe("ended");
    expect(await repo.endRoleplaySession(ID.alex, s.id, outcome)).toBeNull();
    expect(await repo.appendRoleplayTurns(ID.alex, s.id, [{ role: "assistant", content: "c" }])).toBeNull();
    expect((await repo.listRoleplaySessions(ID.alex)).map((x) => x.id)).toEqual([s.id]);
  });
  it("buddy sees only the interests the hire made visible", async () => {
    await repo.saveMatcherProfile({
      hireId: ID.alex, interests: ["chess", "rugby"], suggestions: [],
      visibility: { interests: false, funFacts: true, "interest:rugby": true },
    });
    expect(await repo.getBuddyMatcherView(ID.buddy)).toMatchObject({ hireId: ID.alex, interests: ["rugby"] });
    expect(Object.keys((await repo.getBuddyMatcherView(ID.buddy))!).sort()).toEqual(["hireId", "interests", "updatedAt"]);
    expect(await repo.getBuddyMatcherView(ID.manager)).toBeNull();
  });
});

describe("manager-only notes (Leah pass 2, M2)", () => {
  const asHire = () => (session = { id: ID.tomas, role: "hire", email: "tomas@beryll.demo" });
  const asManager = () => (session = { id: ID.manager, role: "manager", email: "manager@beryll.demo" });
  const asBuddy = () => (session = { id: ID.buddy, role: "buddy", email: "buddy@beryll.demo" });

  it("hides check-in notes from the hire and buddy, shows them to the manager", async () => {
    asManager();
    const forManager = await repo.listCheckins(ID.tomas);
    expect(forManager.some((c) => typeof c.notes === "string" && c.notes.length > 0)).toBe(true);
    for (const viewer of [asHire, asBuddy]) {
      viewer();
      const rows = await repo.listCheckins(ID.tomas);
      expect(rows.length).toBe(forManager.length);
      expect(rows.every((c) => !("notes" in c))).toBe(true);
    }
  });

  it("hides QA notes from the hire (also on the hire's own write) but keeps the QA score", async () => {
    asManager();
    const task = (await repo.getTaskProgress(ID.tomas)).find((t) => t.status === "done")!;
    await repo.setTaskQa(ID.tomas, task.taskId, 80, "Tone too casual for a CFO.");
    expect((await repo.getTaskProgress(ID.tomas)).find((t) => t.taskId === task.taskId)!.data?.qaNotes).toBe("Tone too casual for a CFO.");
    asHire();
    const seen = (await repo.getTaskProgress(ID.tomas)).find((t) => t.taskId === task.taskId)!;
    expect(seen.data?.qaScore).toBe(80);
    expect(seen.data).not.toHaveProperty("qaNotes");
    const written = await repo.upsertTaskProgress({ ...seen, attempts: seen.attempts + 1 });
    expect(written.data).not.toHaveProperty("qaNotes");
    asManager();
    expect((await repo.getTaskProgress(ID.tomas)).find((t) => t.taskId === task.taskId)!.data?.qaNotes).toBe("Tone too casual for a CFO.");
  });

  it("hides certification observation notes from the hire and keeps them through a hire-side save", async () => {
    asManager();
    const full = (await repo.getCertification(ID.tomas, "days8-30"))!;
    expect(typeof full.managerObservation?.notes).toBe("string");
    asHire();
    const seen = (await repo.getCertification(ID.tomas, "days8-30"))!;
    expect(seen.managerObservation).toBeDefined();
    expect(seen.managerObservation).toHaveProperty("scores");
    expect(seen.managerObservation).not.toHaveProperty("notes");
    // e.g. /api/ai/roleplay grading as the hire, passing back the observation it read
    const saved = await repo.saveCertification({ ...seen, attempts: seen.attempts + 1 });
    expect(saved.managerObservation).not.toHaveProperty("notes");
    asManager();
    expect((await repo.getCertification(ID.tomas, "days8-30"))!.managerObservation?.notes).toBe(full.managerObservation?.notes);
  });
});

describe("quests and kudos guards (Leah pass 2, M3/L5)", () => {
  it("never stores confirmation fields from the quest creator", async () => {
    const q = await repo.createQuest({ hireId: ID.alex, type: "meet", title: "x", confirmedAt: NOW.toISOString(), confirmedBy: ID.alex } as never);
    expect(q.confirmedAt).toBeUndefined();
    expect(q.confirmedBy).toBeUndefined();
  });

  it("only sends kudos between people who work together", async () => {
    await expect(repo.addKudos(ID.buddy, ID.alex, "Great first week")).resolves.toMatchObject({ toId: ID.alex });
    await expect(repo.addKudos(ID.alex, ID.manager, "Thanks for the welcome")).resolves.toMatchObject({ toId: ID.manager });
    await expect(repo.addKudos(ID.buddy, ID.nadia, "Not my hire")).rejects.toThrow(/Kudos/);
    await expect(repo.addKudos(ID.luca, ID.sofia, "Peer")).rejects.toThrow(/Kudos/);
  });
});
