import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { isSupabaseConfigured } from "../supabase/env";
import { createSupabaseAdminClient } from "../supabase/admin";
import { createSupabaseServerClient } from "../supabase/server";
import { createMemoryRepo, getMemoryStore } from "./memory";
import type { Repository } from "./repo";
import { SESSION_COOKIE, verifySession } from "./session";
import { createSupabaseRepo } from "./supabase";

export type { Repository } from "./repo";
export * from "./types";

/** "supabase" when NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set, else "memory". */
export function dataMode(): Repository["mode"] {
  return isSupabaseConfigured() ? "supabase" : "memory";
}

/** Memory-mode session from the signed demo cookie. */
export async function readMemorySession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/**
 * The repository for this request. Server-only.
 * Supabase mode: per-request client with the user's auth cookie (RLS applies).
 * Memory mode: process-wide seeded store.
 */
export const getRepo = cache(async (): Promise<Repository> => {
  if (isSupabaseConfigured()) return createSupabaseRepo(await createSupabaseServerClient());
  return createMemoryRepo(getMemoryStore(), readMemorySession);
});

/**
 * Repository that bypasses per-caller checks (Supabase: service-role client, no RLS).
 * Use ONLY in server actions AFTER an explicit authorisation check in that action, for a
 * write the signed-in user may not make directly (e.g. a buddy's confirmed quest completing
 * the hire's roadmap task). Memory mode: the normal store.
 */
export async function getSystemRepo(): Promise<Repository> {
  if (isSupabaseConfigured()) return createSupabaseRepo(createSupabaseAdminClient(), { system: true });
  return createMemoryRepo(getMemoryStore(), readMemorySession);
}
