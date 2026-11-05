"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client (anon key, RLS applies). Returns null in memory mode. */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}
