import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "@/lib/types";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("react", async () => ({ ...(await vi.importActual<object>("react")), cache: <T,>(fn: T) => fn }));
const auth = vi.hoisted(() => ({ user: null as Profile | null }));
vi.mock("@/lib/data/auth", () => ({ requireUser: async () => auth.user! }));

for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"]) delete process.env[k];

const { resetMemoryStore } = await import("@/lib/data/memory");
const { getRepo } = await import("@/lib/data");
const { DEMO_IDS } = await import("@/content/demo");
const { phishingKey } = await import("@/content/server");
const { DAILY_ATTEMPT_CAP } = await import("@/components/labs/attempt-cap");
const { submitPhishing } = await import("./actions");

const PHISH_TASK = "lab-phish-email";
const ALL_SPOTS = ["from", "replyTo", "subject", "link", "attachment", "body-0", "body-1", "body-2", "body-3", "body-4", "body-5"];

const statusOf = async (taskId: string) => (await (await getRepo()).getTaskProgress(auth.user!.id)).find((p) => p.taskId === taskId);

describe("lab actions", () => {
  beforeEach(async () => {
    resetMemoryStore();
    // Luca is on day 9: the phishing lab is open and not done yet.
    auth.user = (await (await getRepo()).getProfile(DEMO_IDS.luca))!;
  });

  describe("submitPhishing reveal rule", () => {
    it("a wrong action returns counts only, never the flags or the correct action", async () => {
      const r = await submitPhishing(ALL_SPOTS, "delete");
      expect(r).toMatchObject({ ok: true, actionCorrect: false, reveal: null, reward: null });
      if (!r.ok) throw new Error("expected ok");
      expect(r.foundCount + r.missedCount).toBe(phishingKey.redFlags.length);
      const json = JSON.stringify(r);
      expect(json).not.toContain(phishingKey.correctAction);
      for (const f of phishingKey.redFlags) expect(json).not.toContain(f.description);
      expect((await statusOf(PHISH_TASK))?.status).not.toBe("done");
    });

    it("the right action passes and reveals every flag and the correct action", async () => {
      const r = await submitPhishing(ALL_SPOTS, "report");
      expect(r).toMatchObject({ ok: true, actionCorrect: true });
      if (!r.ok) throw new Error("expected ok");
      expect(r.reveal?.correctAction).toBe(phishingKey.correctAction);
      expect(r.reveal?.flags).toHaveLength(phishingKey.redFlags.length);
      expect((await statusOf(PHISH_TASK))?.status).toBe("done");
    });

    it("once done, a wrong practice action shows the answer and writes nothing", async () => {
      await submitPhishing(ALL_SPOTS, "report");
      const before = JSON.stringify(await statusOf(PHISH_TASK));
      const r = await submitPhishing([], "click");
      expect(r).toMatchObject({ ok: true, actionCorrect: false, reward: null });
      if (r.ok) expect(r.reveal?.flags).toHaveLength(phishingKey.redFlags.length);
      expect(JSON.stringify(await statusOf(PHISH_TASK))).toBe(before);
    });
  });

  describe("daily attempt cap", () => {
    it(`refuses the ${DAILY_ATTEMPT_CAP + 1}th phishing attempt of the day with a friendly message`, async () => {
      for (let i = 0; i < DAILY_ATTEMPT_CAP; i++) expect((await submitPhishing([], "forward")).ok).toBe(true);
      const r = await submitPhishing(ALL_SPOTS, "report");
      expect(r).toMatchObject({ ok: false, code: "rate_limited" });
      if (!r.ok) expect(r.error).toMatch(/tomorrow/);
      expect((await statusOf(PHISH_TASK))?.status).not.toBe("done");
    });


    it("a new UTC day resets the cap", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      try {
        vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
        for (let i = 0; i < DAILY_ATTEMPT_CAP; i++) await submitPhishing([], "forward");
        expect((await submitPhishing([], "forward")).ok).toBe(false);
        vi.setSystemTime(new Date("2026-11-06T00:00:01Z"));
        expect((await submitPhishing([], "forward")).ok).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
