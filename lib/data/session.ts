import "server-only";
import type { Role } from "../types";
import type { SessionUser } from "./types";

/**
 * DEMO-ONLY signed-cookie session used when Supabase is not configured.
 * HMAC-SHA256 over a base64url JSON payload, via Web Crypto so it runs in
 * both the Node runtime and the middleware (edge) runtime.
 * Not a substitute for real auth: there is no revocation.
 * Secret: DEMO_SESSION_SECRET. Outside production a public fallback is used so
 * `npm run dev` works with no setup. In production (NODE_ENV=production) the
 * secret is REQUIRED (min 32 chars): without it no session can be signed or
 * verified (fail closed), because anyone could forge a manager cookie with the
 * public fallback.
 */

export const SESSION_COOKIE = "beryll_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

const FALLBACK_SECRET = "beryll-demo-only-insecure-secret-change-me";
const ROLES: readonly Role[] = ["hire", "manager", "buddy"];

interface Payload extends SessionUser {
  exp: number; // unix seconds
}

export const MIN_SECRET_LENGTH = 32;

export class SessionConfigError extends Error {
  constructor() {
    super(`DEMO_SESSION_SECRET must be set (at least ${MIN_SECRET_LENGTH} characters) in production`);
    this.name = "SessionConfigError";
  }
}

/** The signing secret, or null when misconfigured in production (fail closed). */
export function sessionSecret(env: { DEMO_SESSION_SECRET?: string; NODE_ENV?: string } = process.env): string | null {
  const s = env.DEMO_SESSION_SECRET?.trim();
  if (env.NODE_ENV !== "production") return s || FALLBACK_SECRET;
  return s && s.length >= MIN_SECRET_LENGTH && s !== FALLBACK_SECRET ? s : null;
}

function secret(): string {
  const s = sessionSecret();
  if (!s) throw new SessionConfigError();
  return s;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secretValue: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secretValue), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(
  user: SessionUser,
  opts: { maxAgeS?: number; now?: number; secret?: string } = {},
): Promise<string> {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const payload: Payload = { id: user.id, role: user.role, email: user.email, exp: now + (opts.maxAgeS ?? SESSION_MAX_AGE_S) };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key(opts.secret ?? secret()), enc.encode(body));
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined | null,
  opts: { now?: number; secret?: string } = {},
): Promise<SessionUser | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, sig] = parts;
  const signingSecret = opts.secret ?? sessionSecret();
  if (!signingSecret) {
    console.error("[session] DEMO_SESSION_SECRET is missing or too short; rejecting all demo sessions");
    return null;
  }
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(signingSecret),
      fromB64url(sig) as BufferSource,
      enc.encode(body),
    );
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as Partial<Payload>;
    const now = opts.now ?? Math.floor(Date.now() / 1000);
    if (typeof p.exp !== "number" || p.exp <= now) return null;
    if (typeof p.id !== "string" || typeof p.email !== "string" || !ROLES.includes(p.role as Role)) return null;
    return { id: p.id, role: p.role as Role, email: p.email };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_S,
};
