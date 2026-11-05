/**
 * Seeds the Supabase project with the demo accounts, staff directory and the
 * dummy hires' history from content/demo.ts + content/demo-contracts.ts.
 * Run: npm run seed
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from env or
 * .env.local). DEMO_PASSWORD falls back to content/demo.ts, except in production
 * (NODE_ENV or VERCEL_ENV = production), where seeding refuses to run without it.
 * Missing env => prints what is missing and exits 0 (the app then runs on the
 * in-memory store, which seeds itself from the same content).
 *
 * Idempotent: users, profiles and staff are upserted; the demo hires' history
 * is reset and re-upserted with stable ids.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

function loadEnvFile() {
  const f = path.join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/** lib/data and content/server import "server-only", which throws outside React Server. Stub it for this script. */
function stubServerOnly() {
  const req = createRequire(__filename);
  const id = req.resolve("server-only");
  req.cache[id] = { id, filename: id, loaded: true, exports: {} } as unknown as NodeJS.Module;
}

async function main() {
  loadEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (missing.length) {
    console.log(`[seed] Skipped: ${missing.join(" and ")} not set (env or .env.local).`);
    console.log("[seed] Nothing to do. Without Supabase the app uses the in-memory store, seeded from content/ on start.");
    return;
  }

  stubServerOnly();
  const { createClient } = await import("@supabase/supabase-js");
  const { seedSupabase } = await import("../lib/data/seed");
  const admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });

  const started = Date.now();
  const res = await seedSupabase(admin);
  for (const w of res.warnings) console.warn(`[seed] Warning: ${w}`);
  console.log(`[seed] Seeded ${res.users} demo users in ${((Date.now() - started) / 1000).toFixed(1)}s.`);
  for (const [table, n] of Object.entries(res.rows)) console.log(`[seed]   ${table}: ${n}`);
  console.log(`[seed] Demo password: ${process.env.DEMO_PASSWORD ? "DEMO_PASSWORD from env" : "content/demo.ts default"}.`);
}

main().catch((e) => {
  console.error(`[seed] Failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
