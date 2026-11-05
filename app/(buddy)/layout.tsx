import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/data/auth";

export default async function BuddyLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser("buddy");
  return (
    <AppShell role="buddy" profile={profile}>
      {children}
    </AppShell>
  );
}
