import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { requireUser } from "@/lib/data/auth";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser("manager");
  return (
    <AppShell role="manager" profile={profile}>
      {children}
    </AppShell>
  );
}
