/** Supabase is used only when both public env vars are set; otherwise the in-memory store. */
export function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}

type DemoEnv = { NEXT_PUBLIC_DEMO_MODE?: string; DEMO_MODE?: string; NODE_ENV?: string };

/**
 * SERVER gate for demo features (quick-login, demo-account sign-in, time-skip).
 * On when NEXT_PUBLIC_DEMO_MODE === "true" AND (not production OR DEMO_MODE === "true").
 *
 * Read at RUNTIME: `env` defaults to process.env and is accessed by property on a
 * variable, so Next.js cannot inline the values at build time. A production deploy can
 * switch demo mode off by unsetting DEMO_MODE, without a rebuild. In a browser bundle
 * process.env is empty, so this returns false there: never use it to gate anything on
 * the client.
 */
export function isDemoMode(env: DemoEnv = process.env): boolean {
  if (env.NEXT_PUBLIC_DEMO_MODE !== "true") return false;
  return env.NODE_ENV !== "production" || env.DEMO_MODE === "true";
}
