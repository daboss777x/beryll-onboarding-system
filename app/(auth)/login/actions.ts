"use server";

import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";
import { safeNext } from "@/lib/data/access";
import { signInWithPassword, signOutCurrentUser } from "@/lib/data/auth";
import { demoPassword } from "@/lib/data/seed";
import { isDemoMode } from "@/lib/supabase/env";

const DEMO_EMAIL: Record<Role, string> = {
  hire: "hire@beryll.demo",
  manager: "manager@beryll.demo",
  buddy: "buddy@beryll.demo",
};

function back(error: string, next?: string): never {
  const qs = new URLSearchParams({ error });
  if (next) qs.set("next", next);
  redirect(`/login?${qs.toString()}`);
}

export async function signIn(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || undefined;
  const res = await signInWithPassword(email, password);
  if (!res.ok) back(res.error, next);
  redirect(safeNext(next, res.role));
}

/**
 * Demo quick-login. Gated by the server-side, runtime isDemoMode() (NEXT_PUBLIC_DEMO_MODE=true,
 * plus DEMO_MODE=true in production). signInWithPassword re-checks it for demo accounts.
 * The password stays server-side.
 */
export async function demoSignIn(formData: FormData): Promise<void> {
  if (!isDemoMode()) back("Demo logins are turned off.");
  const role = String(formData.get("role") ?? "") as Role;
  const next = String(formData.get("next") ?? "") || undefined;
  const email = DEMO_EMAIL[role];
  if (!email) back("Unknown demo account.");
  const res = await signInWithPassword(email, demoPassword());
  if (!res.ok) back(res.error, next);
  redirect(safeNext(next, res.role));
}

export async function signOut(): Promise<void> {
  await signOutCurrentUser();
  redirect("/login");
}
