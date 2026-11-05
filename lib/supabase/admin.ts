import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Service-role client. BYPASSES RLS. Use only in scripts (seeding, embeddings)
 * and for server-side XP/trophy awards in lib/data/supabase.ts (after an RLS
 * visibility check). Never hand it to other request code acting for a user.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const env = supabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !key) throw new Error("Supabase admin client needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  return createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
