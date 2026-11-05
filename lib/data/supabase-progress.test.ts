/**
 * Leah: scored/completion writes in Supabase mode go through the service-role client only
 * after checking the caller is the hire or the hire's manager (RLS gives users no write).
 */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));
import { createSupabaseRepo } from "./supabase";

type Call = { client: "user" | "admin"; table: string; op: string };

/** Minimal chainable PostgREST fake. `profileVisible` answers the manager check. */
function fakes(uid: string | null, profileVisible: boolean) {
  const calls: Call[] = [];
  const make = (client: Call["client"]) =>
    ({
      auth: { getUser: async () => ({ data: { user: uid ? { id: uid } : null } }) },
      from(table: string) {
        const chain: Record<string, unknown> = {};
        const result = () => {
          if (table === "profiles") return { data: profileVisible ? { id: "h1" } : null, error: null };
          return { data: { hire_id: "h1", stage_id: "s", task_id: "t", status: "done", data: {}, attempts: 1, created_at: "x" }, error: null };
        };
        for (const op of ["select", "eq", "match", "order"]) chain[op] = () => chain;
        for (const op of ["insert", "upsert", "update", "delete"])
          chain[op] = () => {
            calls.push({ client, table, op });
            return chain;
          };
        chain.single = async () => result();
        chain.maybeSingle = async () => result();
        return chain;
      },
    }) as unknown as SupabaseClient;
  return { calls, user: make("user"), admin: make("admin") };
}

const writes = (repo: ReturnType<typeof createSupabaseRepo>) => [
  () => repo.upsertTaskProgress({ hireId: "h1", taskId: "t", status: "done", score: 100, attempts: 1 }),
  () => repo.upsertStageProgress({ hireId: "h1", stageId: "day1", status: "done" }),
  () => repo.addQuizAttempt({ hireId: "h1", quizId: "q", answers: {}, score: 100, missedItemIds: [] }),
  () => repo.saveWalkthroughRun({ hireId: "h1", walkthroughId: "w", mode: "solo", errors: 0, durationMs: 1, passed: true }),
  () => repo.saveRoleplaySession({ hireId: "h1", personaId: "p", isCertification: true, transcript: [], rubricScores: [], passed: true }),
  () => repo.saveCertification({ hireId: "h1", stageId: "days8-30", status: "pending", attempts: 1 }),
  () => repo.upsertReviewItem({ hireId: "h1", itemId: "i", quizId: "q", dueDay: 3, step: 0 }),
  () => repo.removeReviewItem("h1", "i"),
  () => repo.upsertScorecardItem({ hireId: "h1", horizon: 30, goal: "g", target: "t", status: "on_track" }),
  () => repo.createRoleplaySession({ hireId: "h1", personaId: "p", isCertification: false }),
  () => repo.submitPulse({ hireId: "h1", day: 7, clarity: 4, confidence: 4, belonging: 4, submittedAt: "x" }),
  () =>
    repo.endRoleplaySession("h1", "00000000-0000-4000-8000-000000000000", {
      rubricScores: [], overall: 50, aiSummary: "s", passed: false, endResponse: {},
    }),
];

describe("Supabase progress writes", () => {
  it("the hire's own writes use the service role, never the user client", async () => {
    const f = fakes("h1", false);
    const repo = createSupabaseRepo(f.user, { awardsClient: () => f.admin });
    const all = writes(repo);
    for (const w of all) await w();
    expect(f.calls).toHaveLength(all.length);
    expect(f.calls.every((c) => c.client === "admin")).toBe(true);
  });
  it("the hire's manager may write (checked through RLS on profiles)", async () => {
    const f = fakes("m1", true);
    const repo = createSupabaseRepo(f.user, { awardsClient: () => f.admin });
    await writes(repo)[0]();
    expect(f.calls).toEqual([{ client: "admin", table: "task_progress", op: "upsert" }]);
  });
  it("anyone else (another hire, a buddy, signed out) is refused before any write", async () => {
    for (const uid of ["other-hire", null]) {
      const f = fakes(uid, false);
      const repo = createSupabaseRepo(f.user, { awardsClient: () => f.admin });
      for (const w of writes(repo)) await expect(w()).rejects.toThrow(/progress/);
      expect(f.calls).toEqual([]);
    }
  });
  it("system mode (getSystemRepo, caller already authorised) writes with the given service client and skips the caller check", async () => {
    const f = fakes(null, false); // no signed-in user, no visible profile
    const repo = createSupabaseRepo(f.admin, { system: true });
    await writes(repo)[0]();
    await repo.addXpEvent({ hireId: "h1", source: "quest:q1", amount: 20 });
    expect(f.calls.map((c) => c.client)).toEqual(["admin", "admin"]);
  });
});

describe("manager-only notes (Leah pass 2, M2)", () => {
  /** Records every write with its payload; manager_notes reads return `notes`. */
  function recorder(uid: string, notes: { subject: string; body: string }[]) {
    const writes: { client: string; table: string; op: string; payload: unknown }[] = [];
    const make = (client: string) =>
      ({
        auth: { getUser: async () => ({ data: { user: { id: uid } } }) },
        from(table: string) {
          const chain: Record<string, unknown> = {};
          for (const op of ["select", "eq", "match", "order", "like"]) chain[op] = () => chain;
          for (const op of ["insert", "upsert", "update", "delete"])
            chain[op] = (payload?: unknown) => {
              writes.push({ client, table, op, payload });
              return chain;
            };
          const row = { hire_id: "h1", stage_id: "days8-30", status: "pending", attempts: 1, manager_observation: { scores: [] }, updated_at: "x" };
          chain.single = async () => ({ data: table === "profiles" ? { id: "h1" } : row, error: null });
          chain.maybeSingle = chain.single;
          chain.then = (res: (v: unknown) => unknown) => res({ data: table === "manager_notes" ? notes : [], error: null });
          return chain;
        },
      }) as unknown as SupabaseClient;
    return { writes, user: make("user"), admin: make("admin") };
  }

  it("saveCertification keeps notes out of the certifications row and writes them to manager_notes with the user's client", async () => {
    const f = recorder("m1", []);
    const repo = createSupabaseRepo(f.user, { awardsClient: () => f.admin });
    await repo.saveCertification({ hireId: "h1", stageId: "days8-30", status: "passed", attempts: 1, managerObservation: { scores: [], notes: "private" } });
    const cert = f.writes.find((w) => w.table === "certifications")!;
    expect(cert.client).toBe("admin");
    expect((cert.payload as { manager_observation: object }).manager_observation).toEqual({ scores: [] });
    expect(f.writes.find((w) => w.table === "manager_notes")).toMatchObject({
      client: "user", op: "upsert", payload: { hire_id: "h1", subject: "cert:days8-30:notes", body: "private" },
    });
  });

  it("a save without a notes key (hire-side grading) does not touch manager_notes", async () => {
    const f = recorder("h1", []);
    const repo = createSupabaseRepo(f.user, { awardsClient: () => f.admin });
    await repo.saveCertification({ hireId: "h1", stageId: "days8-30", status: "pending", attempts: 2, managerObservation: { scores: [] } });
    expect(f.writes.some((w) => w.table === "manager_notes")).toBe(false);
  });

  it("getCertification merges notes only when RLS returns them", async () => {
    const withNotes = createSupabaseRepo(recorder("m1", [{ subject: "cert:days8-30:notes", body: "private" }]).user);
    expect((await withNotes.getCertification("h1"))?.managerObservation).toEqual({ scores: [], notes: "private" });
    const hireView = createSupabaseRepo(recorder("h1", []).user);
    expect((await hireView.getCertification("h1"))?.managerObservation).toEqual({ scores: [] });
  });
});
