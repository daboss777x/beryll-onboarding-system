import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile, Role } from "../types";
import { isDemoMode, isSupabaseConfigured } from "../supabase/env";
import { createSupabaseServerClient } from "../supabase/server";
import { homeFor } from "./access";
import { getRepo } from "./index";
import { getMemoryStore, memoryFindUserByEmail } from "./memory";
import { demoPassword } from "./seed";
import { SESSION_COOKIE, SessionConfigError, sessionCookieOptions, signSession } from "./session";

export { homeFor } from "./access";

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message = status === 401 ? "Not signed in" : "Forbidden",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type RoleCheck = { ok: true } | { ok: false; status: 401 | 403 };

/** Pure role guard used by requireUser/requireApiUser (and tests). */
export function checkRole(profile: Pick<Profile, "role"> | null, role?: Role | readonly Role[]): RoleCheck {
  if (!profile) return { ok: false, status: 401 };
  if (!role) return { ok: true };
  const allowed = Array.isArray(role) ? role : [role];
  return allowed.includes(profile.role) ? { ok: true } : { ok: false, status: 403 };
}

export async function getCurrentUser(): Promise<Profile | null> {
  return (await getRepo()).getSessionProfile();
}

/**
 * Server Components / Server Actions: returns the signed-in profile or
 * redirects (to /login when signed out, to the user's home on wrong role).
 */
export async function requireUser(role?: Role | readonly Role[]): Promise<Profile> {
  const profile = await getCurrentUser();
  const check = checkRole(profile, role);
  if (!check.ok) redirect(check.status === 401 ? "/login" : homeFor(profile!.role));
  return profile!;
}

/** Route Handlers: like requireUser but throws AuthError (map to 401/403 JSON). */
export async function requireApiUser(role?: Role | readonly Role[]): Promise<Profile> {
  const profile = await getCurrentUser();
  const check = checkRole(profile, role);
  if (!check.ok) throw new AuthError(check.status);
  return profile!;
}

/** Convenience for route handlers: `catch (e) { return authErrorResponse(e) ?? ... }`. */
export function authErrorResponse(e: unknown): Response | null {
  return e instanceof AuthError ? Response.json({ error: e.message }, { status: e.status }) : null;
}

// ---------------------------------------------------------------------------
// Sign-in / sign-out core (used by app/(auth) server actions + logout route)
// ---------------------------------------------------------------------------

export type SignInResult = { ok: true; role: Role } | { ok: false; error: string };

/** One message for every refusal, so sign-in doesn't reveal which accounts exist or are demo-only. */
const BAD_CREDENTIALS = "Email or password is incorrect.";

export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) return { ok: false, error: "Enter your email and password." };

  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
    if (error || !data.user) return { ok: false, error: BAD_CREDENTIALS };
    // Demo accounts share a password that ships in the repo: refuse them unless demo mode is on.
    if (data.user.app_metadata?.is_demo === true && !isDemoMode()) {
      await sb.auth.signOut();
      return { ok: false, error: BAD_CREDENTIALS };
    }
    const role = data.user.app_metadata?.role as Role | undefined;
    if (!role) {
      await sb.auth.signOut();
      return { ok: false, error: "This account has no role yet. Ask an admin to finish setting it up." };
    }
    return { ok: true, role };
  }

  // Memory mode (DEMO ONLY): every seeded account is a demo account sharing the demo password,
  // so the whole branch is refused when demo mode is off (always in production without DEMO_MODE).
  if (!isDemoMode()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] In-memory sign-in needs NEXT_PUBLIC_DEMO_MODE=true (the memory store only has demo accounts).");
    }
    return { ok: false, error: BAD_CREDENTIALS };
  }
  const profile = memoryFindUserByEmail(getMemoryStore(), cleanEmail);
  if (!profile || !profile.isDemo || !timingSafeEqual(password, demoPassword())) {
    return { ok: false, error: BAD_CREDENTIALS };
  }
  let token: string;
  try {
    token = await signSession({ id: profile.id, role: profile.role, email: profile.email });
  } catch (e) {
    if (!(e instanceof SessionConfigError)) throw e;
    console.error(`[auth] ${e.message}`);
    return { ok: false, error: "Sign-in isn't set up on this server yet. Ask the admin to set DEMO_SESSION_SECRET." };
  }
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
  return { ok: true, role: profile.role };
}

export async function signOutCurrentUser(): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  (await cookies()).delete(SESSION_COOKIE);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
