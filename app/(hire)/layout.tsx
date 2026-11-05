import type { ReactNode } from "react";
import { AppShell } from "@/components/app/AppShell";
import { currentStage, loadHireState } from "@/components/app/hire-state";
import { stages } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { isDemoMode } from "@/lib/supabase/env";

export default async function HireLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser("hire");
  const state = await loadHireState(await getRepo(), profile);
  const stage = currentStage(state);
  const todayEyebrow = state.programDay === 0 ? "Before you start" : `Day ${state.programDay} · ${stage.title}`;
  const demo = isDemoMode() && profile.isDemo ? { stages: stages.map((s) => ({ id: s.id, title: s.title })) } : undefined;
  return (
    <AppShell role="hire" profile={profile} programDay={state.programDay} stageTitle={stage.title} demo={demo} todayEyebrow={todayEyebrow}>
      {children}
    </AppShell>
  );
}
