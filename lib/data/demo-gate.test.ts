/**
 * Leah pass 2: H1 (demo password works with demo mode off) and M4 (demo mode decided
 * at build time). The server decides demo mode at runtime and refuses demo accounts
 * while it is off.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));

// Supabase auth fake: whatever user `sbUser` holds signs in successfully.
let sbUser: { id: string; app_metadata: Record<string, unknown> } | null = null;
const sbSignOut = vi.fn(async () => ({ error: null }));
vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signInWithPassword: async () => (sbUser ? { data: { user: sbUser }, error: null } : { data: { user: null }, error: { message: "bad" } }),
      signOut: sbSignOut,
    },
  }),
}));

import { isDemoMode } from "../supabase/env";
import { canAccess, roleForPath } from "./access";
import { signInWithPassword } from "./auth";
import { SESSION_COOKIE } from "./session";
import { SeedConfigError, seedPassword } from "./seed";
import { DEMO_PASSWORD } from "../../content/demo";

const GENERIC = "Email or password is incorrect.";

beforeEach(() => {
  cookieJar.clear();
  sbUser = null;
  sbSignOut.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
  vi.stubEnv("DEMO_MODE", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("isDemoMode() (runtime, server-side)", () => {
  const cases: [string | undefined, string | undefined, string | undefined, boolean][] = [
    // NEXT_PUBLIC_DEMO_MODE, DEMO_MODE, NODE_ENV, expected
    [undefined, undefined, "development", false],
    ["", "true", "development", false],
    ["false", "true", "production", false],
    ["true", undefined, "development", true],
    ["true", undefined, "test", true],
    ["true", undefined, undefined, true],
    ["true", undefined, "production", false],
    ["true", "", "production", false],
    ["true", "false", "production", false],
    ["true", "1", "production", false],
    ["true", "true", "production", true],
    [undefined, "true", "production", false],
  ];
  it.each(cases)("NEXT_PUBLIC_DEMO_MODE=%s DEMO_MODE=%s NODE_ENV=%s -> %s", (pub, server, nodeEnv, expected) => {
    expect(isDemoMode({ NEXT_PUBLIC_DEMO_MODE: pub, DEMO_MODE: server, NODE_ENV: nodeEnv })).toBe(expected);
  });

  it("reads process.env on every call (no build-time snapshot)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("DEMO_MODE", "true");
    expect(isDemoMode()).toBe(true);
    vi.stubEnv("DEMO_MODE", "");
    expect(isDemoMode()).toBe(false);
  });
});

describe("memory sign-in is demo-only", () => {
  it("refuses a demo account with the right password when demo mode is off (dev)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await signInWithPassword("manager@beryll.demo", DEMO_PASSWORD)).toEqual({ ok: false, error: GENERIC });
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
  });

  it("refuses in production unless DEMO_MODE=true is set at runtime", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_SESSION_SECRET", "a-strong-secret-for-tests-0123456789abcdef");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    expect(await signInWithPassword("hire@beryll.demo", DEMO_PASSWORD)).toEqual({ ok: false, error: GENERIC });
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
    vi.stubEnv("DEMO_MODE", "true");
    expect(await signInWithPassword("hire@beryll.demo", DEMO_PASSWORD)).toEqual({ ok: true, role: "hire" });
    expect(cookieJar.has(SESSION_COOKIE)).toBe(true);
  });
});

describe("Supabase sign-in refuses is_demo accounts while demo mode is off", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  });

  it("signs the demo user out again and returns the generic error", async () => {
    sbUser = { id: "u1", app_metadata: { role: "manager", is_demo: true } };
    expect(await signInWithPassword("manager@beryll.demo", DEMO_PASSWORD)).toEqual({ ok: false, error: GENERIC });
    expect(sbSignOut).toHaveBeenCalledTimes(1);
  });

  it("allows the demo user when demo mode is on, and real users either way", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    sbUser = { id: "u1", app_metadata: { role: "manager", is_demo: true } };
    expect(await signInWithPassword("manager@beryll.demo", DEMO_PASSWORD)).toEqual({ ok: true, role: "manager" });
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
    sbUser = { id: "u2", app_metadata: { role: "hire" } };
    expect(await signInWithPassword("real@beryll.ie", "s3cret-pass")).toEqual({ ok: true, role: "hire" });
    expect(sbSignOut).not.toHaveBeenCalled();
  });
});

describe("seedPassword()", () => {
  it("refuses production without an explicit DEMO_PASSWORD", () => {
    expect(() => seedPassword({ NODE_ENV: "production" })).toThrow(SeedConfigError);
    expect(() => seedPassword({ VERCEL_ENV: "production", DEMO_PASSWORD: "  " })).toThrow(SeedConfigError);
    expect(seedPassword({ NODE_ENV: "production", DEMO_PASSWORD: "Explicit-Pass-1" })).toBe("Explicit-Pass-1");
    expect(seedPassword({ NODE_ENV: "development" })).toBe(DEMO_PASSWORD);
  });
});

describe("hire route prefixes (L1)", () => {
  it.each(["/quiz/q1", "/checklist/c1", "/missions/m1", "/review/due", "/pulse/7", "/certification"])("%s belongs to hires", (path) => {
    expect(roleForPath(path)).toBe("hire");
    expect(canAccess("manager", path)).toBe(false);
    expect(canAccess("buddy", path)).toBe(false);
  });
});
