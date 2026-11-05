/**
 * Client-bundle leak scan (Leah). Runs against `.next/static` after `npm run build`;
 * skipped when no build output exists.
 *
 * Every string of 24+ characters inside content/server (answer keys, rubrics, persona
 * hidden goals, model answers) must be absent from the browser bundles, as must the
 * demo session fallback secret, the demo password and any server env var values.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const STATIC_DIR = join(process.cwd(), ".next", "static");
const hasBuild = existsSync(STATIC_DIR);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(js|css|json|html|txt)$/.test(n) ? [p] : [];
  });
}

function strings(v: unknown, out: Set<string>): Set<string> {
  if (typeof v === "string") out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, out));
  return out;
}

/** JS bundles escape quotes/unicode, so compare on a normalised form. */
const norm = (s: string) => s.replace(/\\u[0-9a-f]{4}|\\.|["'`’‘“”]/gi, "").replace(/\s+/g, " ");

describe.skipIf(!hasBuild)("client bundle leak scan (.next/static)", () => {
  it("contains no server-only content, secrets or env values", async () => {
    const server = await import("@/content/server");
    const pub = await import("@/content");
    // Strings that are also in public content (e.g. clause text, criterion labels) are not secret.
    const publicText = norm(JSON.stringify(pub));
    const secret = [...strings(Object.values(server).filter((v) => typeof v !== "function"), new Set())]
      .filter((s) => s.length >= 24)
      .map(norm)
      .filter((s) => !publicText.includes(s));
    const session = readFileSync(join(process.cwd(), "lib/data/session.ts"), "utf8").match(/FALLBACK_SECRET = "([^"]+)"/)?.[1];
    const envSecrets = ["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DEMO_SESSION_SECRET", "DEMO_PASSWORD"]
      .map((k) => process.env[k])
      .filter((v): v is string => !!v && v.length >= 8);
    const { DEMO_PASSWORD } = await import("@/content/demo");
    const literal = [DEMO_PASSWORD, session, ...envSecrets].filter((v): v is string => !!v);

    expect(secret.length).toBeGreaterThan(100); // sanity: the scan really has the keys
    const leaks: string[] = [];
    for (const f of files(STATIC_DIR)) {
      const raw = readFileSync(f, "utf8");
      const text = norm(raw);
      for (const s of secret) if (text.includes(s)) leaks.push(`${f.slice(STATIC_DIR.length)}: ${s.slice(0, 60)}`);
      for (const s of literal) if (raw.includes(s)) leaks.push(`${f.slice(STATIC_DIR.length)}: literal secret ${s.slice(0, 4)}…`);
    }
    expect(leaks).toEqual([]);
  });
});
