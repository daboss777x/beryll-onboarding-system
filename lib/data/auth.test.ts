import { beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import { canAccess, homeFor, isPublicPath, roleForPath, safeNext } from "./access";
import { AuthError, checkRole, requireApiUser, requireUser, signInWithPassword, signOutCurrentUser } from "./auth";
import { SESSION_COOKIE, signSession, verifySession } from "./session";
import { DEMO_IDS as ID, DEMO_PASSWORD } from "../../content/demo";

const alex = { id: ID.alex, role: "hire" as const, email: "hire@beryll.demo" };

beforeEach(() => {
  cookieJar.clear();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe("session cookie signing", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession(alex);
    expect(await verifySession(token)).toEqual(alex);
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession(alex);
    const [, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...alex, role: "manager", exp: 9e9 })).toString("base64url");
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSession(alex, { secret: "other" });
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects expired tokens and junk", async () => {
    const token = await signSession(alex, { now: 1000, maxAgeS: 10 });
    expect(await verifySession(token, { now: 1009 })).toEqual(alex);
    expect(await verifySession(token, { now: 1010 })).toBeNull();
    for (const junk of [undefined, null, "", "abc", "a.b.c", "!!!.???"]) expect(await verifySession(junk)).toBeNull();
  });

  it("rejects a validly signed payload with an unknown role", async () => {
    const token = await signSession({ ...alex, role: "admin" as never });
    expect(await verifySession(token)).toBeNull();
  });
});

describe("route access rules", () => {
  it("maps roles to homes", () => {
    expect(homeFor("hire")).toBe("/today");
    expect(homeFor("manager")).toBe("/team");
    expect(homeFor("buddy")).toBe("/buddy");
  });

  it("knows public paths", () => {
    for (const p of ["/login", "/logout", "/styleguide", "/styleguide/buttons", "/api/health"]) expect(isPublicPath(p)).toBe(true);
    for (const p of ["/", "/today", "/loginx", "/api/ai/coach"]) expect(isPublicPath(p)).toBe(false);
  });

  it("blocks cross-role areas", () => {
    expect(roleForPath(`/team/${ID.luca}`)).toBe("manager");
    expect(roleForPath("/buddy")).toBe("buddy");
    expect(roleForPath("/contracts/123")).toBe("hire");
    expect(roleForPath("/teams")).toBeNull();
    expect(canAccess("hire", "/team")).toBe(false);
    expect(canAccess("manager", "/today")).toBe(false);
    expect(canAccess("buddy", "/buddy/quests")).toBe(true);
    expect(canAccess("buddy", "/api/ai/coach")).toBe(true);
  });

  it("only follows safe same-site next URLs for the right role", () => {
    expect(safeNext("/roadmap", "hire")).toBe("/roadmap");
    expect(safeNext("//evil.com", "hire")).toBe("/today");
    expect(safeNext("https://evil.com", "hire")).toBe("/today");
    expect(safeNext("/team", "hire")).toBe("/today");
    expect(safeNext("/login", "manager")).toBe("/team");
    expect(safeNext(null, "buddy")).toBe("/buddy");
  });
});

describe("role guards", () => {
  it("checkRole", () => {
    expect(checkRole(null)).toEqual({ ok: false, status: 401 });
    expect(checkRole({ role: "hire" })).toEqual({ ok: true });
    expect(checkRole({ role: "hire" }, "manager")).toEqual({ ok: false, status: 403 });
    expect(checkRole({ role: "buddy" }, ["manager", "buddy"])).toEqual({ ok: true });
  });

  it("requireUser redirects signed-out users to /login and wrong roles home", async () => {
    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
    cookieJar.set(SESSION_COOKIE, await signSession(alex));
    expect((await requireUser("hire")).name).toBe("Alex Byrne");
    await expect(requireUser("manager")).rejects.toThrow("REDIRECT:/today");
  });

  it("requireApiUser throws AuthError with 401/403", async () => {
    await expect(requireApiUser()).rejects.toMatchObject({ status: 401 });
    cookieJar.set(SESSION_COOKIE, await signSession(alex));
    await expect(requireApiUser("buddy")).rejects.toBeInstanceOf(AuthError);
    await expect(requireApiUser("buddy")).rejects.toMatchObject({ status: 403 });
  });
});

describe("memory sign-in", () => {
  it("accepts the demo password, sets a cookie, and signs out", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    expect(await signInWithPassword("hire@beryll.demo", "wrong")).toMatchObject({ ok: false });
    expect(await signInWithPassword("nobody@beryll.demo", DEMO_PASSWORD)).toMatchObject({ ok: false });
    expect(await signInWithPassword(" Manager@Beryll.demo ", DEMO_PASSWORD)).toEqual({ ok: true, role: "manager" });
    expect((await verifySession(cookieJar.get(SESSION_COOKIE)))?.role).toBe("manager");
    await signOutCurrentUser();
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
    vi.unstubAllEnvs();
  });
});
