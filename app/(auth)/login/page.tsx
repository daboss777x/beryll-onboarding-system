import type { Metadata } from "next";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase/env";
import { demoSignIn, signIn } from "./actions";

export const metadata: Metadata = { title: "Sign in · Beryll Onboard" };

const DEMO_CARDS = [
  { role: "hire", name: "Alex Byrne", label: "New hire", blurb: "Business Development Manager, day 0" },
  { role: "manager", name: "Siobhán Kelly", label: "Manager", blurb: "Head of Commercial, five hires" },
  { role: "buddy", name: "Marco Rossi", label: "Buddy", blurb: "Senior Security Consultant, Alex's buddy" },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const demo = isDemoMode();

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Beryll Onboard</h1>
          <p className="text-sm opacity-70">Sign in to continue your onboarding.</p>
        </header>

        {error ? (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-black/15 bg-white/70 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border border-black/15 bg-white/70 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
            Sign in
          </button>
        </form>

        {demo ? (
          <section aria-labelledby="demo-heading" className="space-y-3">
            <h2 id="demo-heading" className="text-center text-xs font-medium uppercase tracking-wide opacity-60">
              Demo quick login
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {DEMO_CARDS.map((c) => (
                <form key={c.role} action={demoSignIn}>
                  <input type="hidden" name="role" value={c.role} />
                  <input type="hidden" name="next" value={next ?? ""} />
                  <button
                    type="submit"
                    data-testid={`demo-login-${c.role}`}
                    className="h-full w-full rounded-lg border border-black/10 bg-white/60 p-3 text-left text-sm hover:bg-white"
                  >
                    <span className="block text-xs opacity-60">{c.label}</span>
                    <span className="block font-medium">{c.name}</span>
                    <span className="block text-xs opacity-70">{c.blurb}</span>
                  </button>
                </form>
              ))}
            </div>
            {!isSupabaseConfigured() ? (
              <p className="text-center text-xs opacity-60">
                Running on the in-memory demo store. Any seeded account signs in with the demo password.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
