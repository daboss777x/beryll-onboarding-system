import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, FastForward } from "lucide-react";
import { GemLogo } from "@/components/brand";
import type { Profile, Role } from "@/lib/types";
import { CoachPanel, CoachTrigger } from "./CoachPanel";
import { DemoTimeSkip, type StageOption } from "./DemoTimeSkip";
import { NavLinks } from "./NavLinks";
import { RouteEyebrow } from "./RouteEyebrow";
import { UserMenu } from "./UserMenu";

const HOME: Record<Role, string> = { hire: "/today", manager: "/team", buddy: "/buddy" };

export function DayChip({ day, stage }: { day: number; stage?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
      <CalendarDays size={14} aria-hidden />
      {day === 0 ? "Pre-boarding" : `Day ${day}`}
      {stage && <span className="hidden font-medium text-muted sm:inline">· {stage}</span>}
    </span>
  );
}

/**
 * Glass sidebar on desktop, top bar + bottom tab bar on mobile.
 * `demo` is passed only for demo hires in demo mode.
 */
export function AppShell({
  role,
  profile,
  programDay,
  stageTitle,
  demo,
  todayEyebrow,
  children,
}: {
  role: Role;
  profile: Profile;
  programDay?: number;
  stageTitle?: string;
  demo?: { stages: StageOption[] };
  /** "Day n · stage" line for /today, rendered here so it never waits for the page to stream. */
  todayEyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-strong focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-3 left-3 z-30 hidden w-64 flex-col rounded-xl p-4 lg:flex">
        <Link href={HOME[role]} className="mb-6 px-2" aria-label="Beryll Onboard home">
          <GemLogo size={30} />
        </Link>
        {programDay !== undefined && (
          <div className="mb-4 px-2">
            <DayChip day={programDay} />
            {stageTitle && <p className="mt-1.5 text-xs text-muted">{stageTitle}</p>}
          </div>
        )}
        <nav aria-label="Main">
          <NavLinks role={role} variant="sidebar" />
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <CoachTrigger />
          {demo && programDay !== undefined && <DemoTimeSkip stages={demo.stages} programDay={programDay} />}
          <UserMenu name={profile.name} title={profile.title} role={role} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between gap-2 rounded-none border-x-0 border-t-0 px-4 py-2 lg:hidden">
        <Link href={HOME[role]} aria-label="Beryll Onboard home">
          <GemLogo size={26} />
        </Link>
        <div className="flex items-center gap-1">
          {programDay !== undefined && <DayChip day={programDay} />}
          <CoachTrigger variant="icon" />
          <UserMenu name={profile.name} title={profile.title} role={role} align="right" compact />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl px-4 pt-4 pb-28 sm:px-6 lg:pt-8 lg:pb-12 lg:pl-[19rem] lg:max-w-none xl:pr-10">
        {demo && programDay !== undefined && (
          <details className="glass mb-4 rounded-lg p-3 lg:hidden">
            <summary className="flex min-h-8 cursor-pointer items-center gap-1.5 text-sm font-medium">
              <FastForward size={16} aria-hidden className="text-accent" /> Demo time-skip
            </summary>
            <div className="mt-3">
              <DemoTimeSkip stages={demo.stages} programDay={programDay} />
            </div>
          </details>
        )}
        <div className="mx-auto w-full max-w-5xl">
          {todayEyebrow && <RouteEyebrow path="/today">{todayEyebrow}</RouteEyebrow>}
          {children}
        </div>
      </main>

      {/* Mobile bottom tabs */}
      <nav aria-label="Main" className="glass fixed inset-x-0 bottom-0 z-30 rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <NavLinks role={role} variant="tabs" />
      </nav>

      {/* Ask Beryl slide-over, opened by CoachTrigger or openCoach() */}
      <CoachPanel role={role} />
    </div>
  );
}
