import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { createMemoryRepo } from "@/lib/data/memory";
import { buildSeed } from "@/lib/data/seed";
import { DEMO_IDS as ID } from "@/content/demo";

describe("resetDemoHire (memory)", () => {
  it("puts a demo hire back to the seeded day, progress, XP, quiz attempts and trophies", async () => {
    const state = buildSeed();
    const repo = createMemoryRepo(state, async () => null);
    const seededTasks = (await repo.getTaskProgress(ID.alex)).length;
    const seededXp = (await repo.listXpEvents(ID.alex)).length;
    const seededTrophies = (await repo.listTrophies(ID.alex)).length;
    const otherHireTasks = (await repo.getTaskProgress(ID.nadia)).length;

    await repo.setDemoDayOffset(ID.alex, 20);
    await repo.upsertTaskProgress({ hireId: ID.alex, taskId: "jumped-task", status: "done", attempts: 1, data: { demoSkipped: true } });
    await repo.addXpEvent({ hireId: ID.alex, source: "jumped-task", amount: 50 });
    await repo.awardTrophy(ID.alex, "some-trophy");
    await repo.addQuizAttempt({ hireId: ID.alex, quizId: "quiz-x", answers: {}, score: 0, missedItemIds: [] });

    await repo.resetDemoHire(ID.alex);

    expect((await repo.getProfile(ID.alex))?.demoDayOffset).toBe(0);
    expect((await repo.getTaskProgress(ID.alex)).length).toBe(seededTasks);
    expect((await repo.listXpEvents(ID.alex)).length).toBe(seededXp);
    expect((await repo.listTrophies(ID.alex)).length).toBe(seededTrophies);
    expect(await repo.listQuizAttempts(ID.alex, "quiz-x")).toEqual([]);
    expect((await repo.getTaskProgress(ID.nadia)).length).toBe(otherHireTasks);
  });

  it("refuses non-hire profiles", async () => {
    const repo = createMemoryRepo(buildSeed(), async () => null);
    await expect(repo.resetDemoHire(ID.manager)).rejects.toThrow();
  });
});
