import Link from "next/link";
import { AlertTriangle, CalendarClock, Gauge, HeartPulse, ShieldCheck, Users } from "lucide-react";
import { cohortMetrics, loadHireSummary, type HireSummary } from "@/components/app/manager-data";
import { PageHeader, Section } from "@/components/app/screen";
import { Avatar, Badge, EmptyState, GlassCard, ProgressBar, RankBadge, Stat } from "@/components/ui";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "Team · Beryll Onboard" };

const UPCOMING_WINDOW = 14;

function dueText(dueDay: number, today: number) {
  const d = dueDay - today;
  if (d < 0) return `${-d} day${d === -1 ? "" : "s"} overdue`;
  if (d === 0) return "Due today";
  return `In ${d} day${d === 1 ? "" : "s"}`;
}

export default async function TeamPage() {
  const manager = await requireUser("manager");
  const repo = await getRepo();
  const hires = await repo.listHiresForManager(manager.id);
  const summaries = (await Promise.all(hires.map((h) => loadHireSummary(repo, h)))).sort(
    (a, b) => b.risks.length - a.risks.length || b.state.programDay - a.state.programDay,
  );
  const first = manager.name.split(" ")[0];

  if (summaries.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Manager" title={`Your team, ${first}`} />
        <EmptyState
          icon={<Users size={26} aria-hidden />}
          title="No new hires yet"
          description="When someone joins your team, they appear here with their progress, check-ins and any risk flags."
        />
      </>
    );
  }

  const atRisk = summaries.filter((s) => s.risks.length > 0);
  const metrics = cohortMetrics(summaries);
  const upcoming = summaries
    .flatMap((s) => [
      ...s.overdueCheckins.map((c) => ({ s, c })),
      ...(s.nextCheckin && s.nextCheckin.dueDay - s.state.programDay <= UPCOMING_WINDOW ? [{ s, c: s.nextCheckin }] : []),
    ])
    .sort((a, b) => a.c.dueDay - a.s.state.programDay - (b.c.dueDay - b.s.state.programDay));
  const ttc = metrics.timeToCertification;
  const pulse = metrics.averagePulse;

  return (
    <>
      <PageHeader
        eyebrow="Manager"
        title={`Your team, ${first}`}
        description={`${summaries.length} new hire${summaries.length === 1 ? "" : "s"} in onboarding. ${atRisk.length ? `${atRisk.length} need${atRisk.length === 1 ? "s" : ""} your attention.` : "Nobody is flagged right now."}`}
      />

      {atRisk.length > 0 && (
        <Section title="Needs attention" description="Flags come from pulses, check-ins, stalled stages, certification and activity.">
          <ul className="grid gap-3 md:grid-cols-2">
            {atRisk.map((s) => (
              <li key={s.profile.id}>
                <GlassCard className="flex h-full flex-col gap-3 border-l-4 border-l-warn">
                  <Link href={`/team/${s.profile.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar name={s.profile.name} size={36} />
                    <span className="font-medium">{s.profile.name}</span>
                    <Badge tone="warn" className="ml-auto">
                      <AlertTriangle size={12} aria-hidden /> At risk
                    </Badge>
                  </Link>
                  <ul className="flex flex-col gap-2 text-sm">
                    {s.risks.map((r) => (
                      <li key={r.reason}>
                        <p className="font-medium">{r.detail}</p>
                        <p className="text-muted">Try: {r.suggestedAction}</p>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="New hires">
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => (
            <li key={s.profile.id}>
              <Link href={`/team/${s.profile.id}`} className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <GlassCard interactive className="flex h-full flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.profile.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.profile.name}</p>
                      <p className="truncate text-xs text-muted">
                        {s.state.programDay === 0 ? "Pre-boarding" : `Day ${s.state.programDay}`} · {s.stageTitle}
                      </p>
                    </div>
                    {s.risks.length > 0 && (
                      <Badge tone="warn" dot>
                        At risk
                      </Badge>
                    )}
                  </div>
                  <ProgressBar value={s.percent} label="Required steps" showValue size="sm" />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <RankBadge rank={s.state.rank} />
                    {s.nextCheckin ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={12} aria-hidden /> {s.nextCheckin.label}: {dueText(s.nextCheckin.dueDay, s.state.programDay).toLowerCase()}
                      </span>
                    ) : (
                      <span>All check-ins held</span>
                    )}
                  </div>
                </GlassCard>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Upcoming check-ins" description={`Overdue, plus anything due in the next ${UPCOMING_WINDOW} days.`}>
        {upcoming.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-muted">Nothing due in the next two weeks. Your rhythm is on track.</p>
          </GlassCard>
        ) : (
          <GlassCard padding="sm">
            <ul className="divide-y divide-border">
              {upcoming.map(({ s, c }) => {
                const overdue = c.dueDay < s.state.programDay;
                return (
                  <li key={`${s.profile.id}-${c.dueDay}`}>
                    <Link href={`/team/${s.profile.id}#checkins`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2.5 hover:bg-surface-strong">
                      <Avatar name={s.profile.name} size={28} />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="font-medium">{s.profile.name}</span> <span className="text-muted">· {c.label} check-in (day {c.dueDay})</span>
                      </span>
                      <Badge tone={overdue ? "danger" : c.dueDay === s.state.programDay ? "aqua" : "neutral"}>{dueText(c.dueDay, s.state.programDay)}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}
      </Section>

      <Section id="cohort" title="Cohort metrics" description="Counts, not percentages of large groups: this is a small team.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Time to certification"
            icon={<ShieldCheck size={16} aria-hidden />}
            value={ttc.averageDays !== null ? `${ttc.averageDays} days` : "None yet"}
            hint={`${ttc.certifiedCount} of ${ttc.total} certified${ttc.fastestDays !== null ? ` · fastest ${ttc.fastestDays} days` : ""}`}
          />
          <Stat label="Process completion" icon={<Gauge size={16} aria-hidden />} value={`${metrics.processCompletion.averagePercent}%`} hint="Average share of required steps done" />
          <Stat
            label="90-day retention"
            icon={<Users size={16} aria-hidden />}
            value={metrics.retention90.eligible ? metrics.retention90.label : "Not yet"}
            hint={metrics.retention90.eligible ? "Hires past day 90 still with us" : "Nobody has reached day 90"}
          />
          <Stat
            label="Average pulse"
            icon={<HeartPulse size={16} aria-hidden />}
            value={pulse.responses ? `${pulse.clarity} · ${pulse.confidence} · ${pulse.belonging}` : "No pulses"}
            hint={pulse.responses ? `Clarity · confidence · belonging, of 5 (${pulse.responses} responses)` : "Pulses run on days 7, 30 and 90"}
          />
        </div>
        <GlassCard className="mt-3">
          <p className="mb-3 text-sm font-semibold">Completion by hire</p>
          <ul className="flex flex-col gap-3">
            {metrics.processCompletion.perHire.map((p) => {
              const s = summaries.find((x) => x.profile.id === p.hireId) as HireSummary;
              return (
                <li key={p.hireId}>
                  <ProgressBar value={p.percent} label={s.risks.length ? `${s.profile.name} (at risk)` : s.profile.name} showValue size="sm" />
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </Section>
    </>
  );
}
