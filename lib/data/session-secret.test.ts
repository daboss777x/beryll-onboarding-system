/** Leah: the demo session must fail closed in production when DEMO_SESSION_SECRET is missing or weak. */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (n: string) => (cookieJar.has(n) ? { name: n, value: cookieJar.get(n)! } : undefined),
    set: (n: string, v: string) => void cookieJar.set(n, v),
    delete: (n: string) => void cookieJar.delete(n),
  }),
}));

import { DEMO_PASSWORD } from "../../content/demo";
import { signInWithPassword } from "./auth";
import { MIN_SECRET_LENGTH, SessionConfigError, sessionSecret, signSession, verifySession } from "./session";

const user = { id: "u1", role: "manager" as const, email: "manager@beryll.demo" };
const strong = "x".repeat(MIN_SECRET_LENGTH);

afterEach(() => {
  vi.unstubAllEnvs();
  cookieJar.clear();
});

describe("sessionSecret()", () => {
  it("uses a public fallback only outside production", () => {
    expect(sessionSecret({ NODE_ENV: "development" })).toBeTruthy();
    expect(sessionSecret({ NODE_ENV: "test", DEMO_SESSION_SECRET: "abc" })).toBe("abc");
  });
  it("returns null in production when the secret is missing, short or the fallback", () => {
    expect(sessionSecret({ NODE_ENV: "production" })).toBeNull();
    expect(sessionSecret({ NODE_ENV: "production", DEMO_SESSION_SECRET: "   " })).toBeNull();
    expect(sessionSecret({ NODE_ENV: "production", DEMO_SESSION_SECRET: "short" })).toBeNull();
    const fallback = sessionSecret({ NODE_ENV: "development" })!;
    expect(sessionSecret({ NODE_ENV: "production", DEMO_SESSION_SECRET: fallback })).toBeNull();
    expect(sessionSecret({ NODE_ENV: "production", DEMO_SESSION_SECRET: strong })).toBe(strong);
  });
});

describe("production without DEMO_SESSION_SECRET", () => {
  it("cannot sign, rejects cookies forged with the public fallback, and login fails politely", async () => {
    const forged = await signSession(user); // NODE_ENV=test: signed with the public fallback
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("DEMO_SESSION_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(signSession(user)).rejects.toBeInstanceOf(SessionConfigError);
    expect(await verifySession(forged)).toBeNull();
    const res = await signInWithPassword("manager@beryll.demo", DEMO_PASSWORD);
    expect(res).toMatchObject({ ok: false, error: expect.stringMatching(/DEMO_SESSION_SECRET/) });
    expect(cookieJar.size).toBe(0);
  });
  it("works with a strong secret, and a fallback-signed cookie is rejected", async () => {
    const forged = await signSession(user);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_SESSION_SECRET", strong);
    expect(await verifySession(forged)).toBeNull();
    expect(await verifySession(await signSession(user))).toEqual(user);
  });
});
