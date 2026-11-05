import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_IDS as ID } from "../../content/demo";
import { contracts as sampleContracts } from "../../content/demo-contracts";
import { stages } from "../../content/stages";
import { tasks } from "../../content/tasks";
import { riskFlags } from "../logic/at-risk";
import { getProgramDay } from "../logic/program-day";
import { certificationDecision, AI_PASS_SCORE, type ManagerObservation } from "../logic/scoring";
import { isCertificationPassed } from "../logic/unlocks";
import { createMemoryRepo } from "./memory";
import type { Repository } from "./repo";
import { buildSeed, seedSupabase, stableUuid, type SeedData } from "./seed";
import { CONTRACT_STATUSES } from "./types";

const NOW = new Date("2026-11-04T12:00:00Z");
let state: SeedData;
let repo: Repository;

beforeEach(() => {
  state = buildSeed(NOW);
  repo = createMemoryRepo(state, async () => null);
});

/** Everything riskFlags needs, read back through the repository. */
async function riskFor(hireId: string) {
  const profile = (await repo.getProfile(hireId))!;
  const programDay = getProgramDay(profile, NOW);
  const stageStatuses = Object.fromEntries((await repo.listStageProgress(hireId)).map((s) => [s.stageId, s.status]));
  const cert = await repo.getCertification(hireId, "days8-30");
  const xp = await repo.listXpEvents(hireId);
  const last = xp.map((e) => e.at).sort().at(-1);
  const lastActivityDay = last ? getProgramDay(profile, new Date(last)) : null;
  return riskFlags(
    profile,
    await repo.listPulses(hireId),
    await repo.listCheckins(hireId),
    stageStatuses,
    { failed: cert?.status === "passed" ? 0 : Math.max(0, (cert?.attempts ?? 0) - 1), passed: cert?.status === "passed" },
    lastActivityDay,
    programDay,
    stages,
  );
}

describe("seed from content/demo.ts", () => {
  it("uses DEMO_IDS for every demo profile", () => {
    expect(state.profiles.map((p) => p.id).sort()).toEqual(Object.values(ID).sort());
    expect(state.credentials["hire@beryll.demo"]).toBe(ID.alex);
  });

  it("flags Nadia as at risk (low belonging pulse + overdue day-70 check-in)", async () => {
    const reasons = (await riskFor(ID.nadia)).map((f) => f.reason);
    expect(reasons).toContain("low_pulse");
    expect(reasons).toContain("overdue_checkin");
  });

  it("does not flag Sofia or Tomás for pulses or check-ins", async () => {
    for (const id of [ID.sofia, ID.tomas]) {
      const reasons = (await riskFor(id)).map((f) => f.reason);
      expect(reasons).not.toContain("low_pulse");
      expect(reasons).not.toContain("overdue_checkin");
    }
  });

  it("puts Sofia near certification: AI score passes, only the manager observation is missing", async () => {
    const progress = await repo.getTaskProgress(ID.sofia);
    expect(isCertificationPassed(tasks, progress)).toBe(false);
    const cert = (await repo.getCertification(ID.sofia, "days8-30"))!;
    expect(cert.status).toBe("pending");
    expect(cert.aiScore).toBeGreaterThanOrEqual(AI_PASS_SCORE);
    const d = certificationDecision({ overall: cert.aiScore!, coaching: [] }, undefined);
    expect(d).toMatchObject({ aiPassed: true, observationMissing: true, decision: "retest" });
  });

  it("has Tomás certified", async () => {
    const progress = await repo.getTaskProgress(ID.tomas);
    expect(isCertificationPassed(tasks, progress)).toBe(true);
    const cert = (await repo.getCertification(ID.tomas, "days8-30"))!;
    expect(cert).toMatchObject({ status: "passed", signedBy: ID.manager });
    const d = certificationDecision({ overall: cert.aiScore!, coaching: [] }, cert.managerObservation as unknown as ManagerObservation);
    expect(d.decision).toBe("passed");
    expect((await repo.listTrophies(ID.tomas)).map((t) => t.trophyId)).toContain("certified-for-solo");
  });

  it("gives every hire the sample contracts with pipeline statuses only", async () => {
    const list = await repo.listContracts(ID.alex);
    expect(list).toHaveLength(sampleContracts.length);
    expect(new Set(state.contracts.map((c) => c.status))).toEqual(new Set(CONTRACT_STATUSES));
    for (const c of state.contracts) expect(CONTRACT_STATUSES).toContain(c.status);
    expect(list[0].clauses[0]).toHaveProperty("body");
  });

  it("rejects unknown contract statuses", async () => {
    const [c] = await repo.listContracts(ID.alex);
    await expect(repo.moveContractStatus(ID.alex, c.id, "client_review" as never)).rejects.toThrow();
  });

  it("keeps the buddy view on Alex with three open quests", async () => {
    expect(await repo.getBuddyHire(ID.buddy)).toMatchObject({ hireId: ID.alex, questsOpen: 3 });
  });

  it("attributes staff kudos to accounts where they exist", async () => {
    const nadia = await repo.listKudos(ID.nadia);
    expect(nadia[0]).toMatchObject({ fromId: ID.manager, fromName: "Siobhán Kelly", kind: "manager" });
    const sofia = await repo.listKudos(ID.sofia);
    expect(sofia.map((k) => k.fromId)).toContain("niamh-ocallaghan");
  });
});

describe("stableUuid", () => {
  it("is deterministic and uuid-shaped", () => {
    expect(stableUuid("kudos-luca-1")).toBe(stableUuid("kudos-luca-1"));
    expect(stableUuid("a")).not.toBe(stableUuid("b"));
    expect(stableUuid("x")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

/** Minimal fake of the service-role client: records writes, keeps auth users. */
function fakeAdmin() {
  const users: { id: string; email: string }[] = [];
  const writes: { op: string; table: string; rows?: unknown[]; onConflict?: string }[] = [];
  const ok = { data: null, error: null };
  const client = {
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [...users] }, error: null }),
        createUser: async (a: { id: string; email: string }) => {
          users.push({ id: a.id, email: a.email });
          return { data: { user: { id: a.id } }, error: null };
        },
        updateUserById: async () => ok,
      },
    },
    from: (table: string) => ({
      upsert: async (rows: unknown[], o?: { onConflict?: string }) => (writes.push({ op: "upsert", table, rows, onConflict: o?.onConflict }), ok),
      delete: () => ({ in: async () => (writes.push({ op: "delete", table }), ok) }),
    }),
  };
  return { client: client as unknown as SupabaseClient, users, writes };
}

describe("seedSupabase", () => {
  it("creates auth users with DEMO_IDS and is idempotent", async () => {
    const f = fakeAdmin();
    const first = await seedSupabase(f.client, NOW);
    expect(f.users.map((u) => u.id).sort()).toEqual(Object.values(ID).sort());
    const firstWrites = JSON.stringify(f.writes);
    f.writes.length = 0;
    const second = await seedSupabase(f.client, NOW);
    expect(f.users).toHaveLength(8); // no duplicates on re-run
    expect(second.warnings).toEqual([]);
    expect(JSON.stringify(f.writes)).toBe(firstWrites);
    expect(second.rows).toEqual(first.rows);
  });

  it("writes only valid contract statuses and staff kudos via from_staff_id", async () => {
    const f = fakeAdmin();
    await seedSupabase(f.client, NOW);
    const rows = (t: string) => f.writes.find((w) => w.op === "upsert" && w.table === t)!.rows as Record<string, unknown>[];
    for (const c of rows("contracts")) expect(CONTRACT_STATUSES).toContain(c.status);
    const kudos = rows("kudos");
    expect(kudos.every((k) => (k.from_id === null) !== (k.from_staff_id === null))).toBe(true);
    expect(rows("xp_events").length).toBeGreaterThan(0);
  });
});
