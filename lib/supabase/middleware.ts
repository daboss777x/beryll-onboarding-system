import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Role } from "../types";
import { supabaseEnv } from "./env";

const ROLES: readonly Role[] = ["hire", "manager", "buddy"];

/**
 * Refreshes the Supabase auth cookie on `response` and returns the signed-in
 * user's id + role. Role is read from app_metadata.role (set by seedSupabase /
 * an admin), so middleware never queries the database.
 */
export async function getSupabaseMiddlewareUser(
  request: NextRequest,
  response: NextResponse,
): Promise<{ id: string; role: Role; email: string; isDemo: boolean } | null> {
  const env = supabaseEnv();
  if (!env) return null;
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const role = u.app_metadata?.role as Role | undefined;
  if (!role || !ROLES.includes(role)) return null;
  return { id: u.id, role, email: u.email ?? "", isDemo: u.app_metadata?.is_demo === true };
}
