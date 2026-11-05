import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "@/lib/types";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("react", async () => ({ ...(await vi.importActual<object>("react")), cache: <T,>(fn: T) => fn }));
const auth = vi.hoisted(() => ({ user: null as Profile | null }));
vi.mock("@/lib/data/auth", () => ({ requireUser: async () => auth.user! }));

for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[k];

const { resetMemoryStore } = await import("@/lib/data/memory");
const { getRepo } = await import("@/lib/data");
const { DEMO_IDS } = await import("@/content/demo");
const { WALKTHROUGHS } = await import("@/content/walkthroughs");
const { DAILY_ATTEMPT_CAP } = await import("@/components/labs/attempt-cap");
const { saveWalkthroughResult } = await import("./actions");

const steps = WALKTHROUGHS["wt-create-sow"].steps.length;
const run = (o: Record<string, unknown>) =>
  saveWalkthroughResult({ walkthroughId: "wt-create-sow", mode: "guided", errors: 0, durationMs: 1000, passed: true, stepsDone: steps, totalSteps: steps, score: 100, completed: true, ...o } as never);

describe("saveWalkthroughResult", () => {
  beforeEach(async () => {
    resetMemoryStore();
    auth.user = (await (await getRepo()).getProfile(DEMO_IDS.luca))!;
  });

  const taskStatus = async (taskId: string) => (await (await getRepo()).getTaskProgress(DEMO_IDS.luca)).find((p) => p.taskId === taskId)?.status;

  it("a clean guided run saves the run and completes the guided task with XP", async () => {
    const r = await run({});
    expect(r.ok).toBe(true);
    expect(await taskStatus("wt-create-sow-guided")).toBe("done");
    expect((await (await getRepo()).listWalkthroughRuns(DEMO_IDS.luca, "wt-create-sow")).length).toBeGreaterThan(0);
  });

  it("ignores the client's passed flag: 3 errors does not complete the task", async () => {
    const before = await taskStatus("wt-create-sow-guided");
    const r = await run({ errors: 3, passed: true });
    expect(r).toMatchObject({ ok: true, counted: false });
    expect(await taskStatus("wt-create-sow-guided")).toBe(before);
  });

  it("an unfinished run is saved but not counted", async () => {
    const r = await run({ stepsDone: 1, completed: true, passed: true });
    expect(r).toMatchObject({ counted: false });
  });

  it("a watch run watched to the end completes the watch task", async () => {
    const r = await run({ mode: "watch" });
    expect(r.ok).toBe(true);
    expect(await taskStatus("wt-create-sow-watch")).toBe("done");
  });

  it("rejects unknown walkthroughs and modes", async () => {
    expect(await run({ walkthroughId: "nope" })).toMatchObject({ ok: false });
    expect(await run({ mode: "turbo" })).toMatchObject({ ok: false });
  });

  it(`saves at most ${DAILY_ATTEMPT_CAP} runs per walkthrough and mode per day, then refuses with a friendly message`, async () => {
    const repo = await getRepo();
    const count = async () => (await repo.listWalkthroughRuns(DEMO_IDS.luca, "wt-create-sow")).length;
    const start = await count();
    // Unfinished runs still write a row, so they count too.
    for (let i = 0; i < DAILY_ATTEMPT_CAP; i++) expect((await run({ mode: "solo", stepsDone: 1 })).ok).toBe(true);
    const r = await run({ mode: "solo" });
    expect(r).toMatchObject({ ok: false });
    if (!r.ok) expect(r.error).toMatch(/tomorrow/);
    expect(await count()).toBe(start + DAILY_ATTEMPT_CAP);
    // The cap is per mode: a guided run still saves.
    expect((await run({})).ok).toBe(true);
  });
});
