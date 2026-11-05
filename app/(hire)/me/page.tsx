import Link from "next/link";
import { Award, Download, Lock, PenLine } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { PageHeader, Section } from "@/components/app/screen";
import { Avatar, Badge, GlassCard, RANKS, RankBadge, TrophyBadge, XpBar, buttonStyles, cn, type BadgeTone } from "@/components/ui";
import { scorecardGoals } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { RANK_ORDER, TROPHY_DEFS } from "@/lib/logic";

export const metadata = { title: "Me · Beryll Onboard" };

const SC_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  on_track: { label: "On track", tone: "aqua" },
  at_risk: { label: "At risk", tone: "warn" },
  done: { label: "Done", tone: "success" },
};

export default async function MePage() {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const [items, manager, buddy] = await Promise.all([
    repo.listScorecardItems(profile.id),
    profile.managerId ? repo.getProfile(profile.managerId) : Promise.resolve(null),
    profile.buddyId ? repo.getProfile(profile.buddyId) : Promise.resolve(null),
  ]);
  const story = state.progress.find((p) => p.taskId === "day1-best-self" && p.status === "done");
  const earned = new Set(state.earnedTrophyIds);
  const rankIdx = RANK_ORDER.indexOf(state.rank);

  const scorecard =
    items.length > 0
      ? items.map((i) => ({ id: i.id, horizon: i.horizon, title: i.goal, target: i.target, status: i.status, agreed: true }))
      : scorecardGoals.map((g) => ({ id: g.id, horizon: g.horizon, title: g.title, target: g.target, status: "not_started", agreed: false }));

  const certs = [
    { id: "day30", title: "Day 30: Certified for solo client contact", earned: state.certificationPassed, how: "Pass certification (AI role-play plus your manager's observation)." },
    { id: "day90", title: "Day 90: Independent", earned: state.day90SignedOff, how: "Your manager signs off your 90 days." },
  ];

  return (
    <>
      <PageHeader eyebrow="Your profile" title={profile.name} description={`${profile.title} · started ${new Date(profile.startDate).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}`} />

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <GlassCard variant="prism" className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={profile.name} size={56} />
            <div className="min-w-0">
              <RankBadge rank={state.rank} />
              <p className="mt-1 text-sm text-muted">{RANKS[state.rank].blurb}</p>
            </div>
          </div>
          <XpBar xp={state.level.xpIntoLevel} nextAt={state.level.xpForNext} levelLabel={`Level ${state.level.level} · ${state.xp} XP total`} nextLabel={`level ${state.level.level + 1}`} />
          <ol className="grid grid-cols-4 gap-1 text-center text-[11px]" aria-label="Rank ladder">
            {RANK_ORDER.map((r, i) => (
              <li key={r} className={cn("rounded-md px-1 py-1.5", i <= rankIdx ? "bg-accent-soft font-semibold text-accent" : "bg-surface-strong text-muted")}>
                {RANKS[r].label}
              </li>
            ))}
          </ol>
        </GlassCard>
        <GlassCard className="flex flex-col gap-3 text-sm">
          <p className="font-semibold">Your people</p>
          <p>
            <span className="text-muted">Manager: </span>
            {manager?.name ?? "Not assigned yet"}
          </p>
          <p>
            <span className="text-muted">Buddy: </span>
            {buddy?.name ?? "Not assigned yet"}
          </p>
          <p>
            <span className="text-muted">Streak: </span>
            {state.streak} day{state.streak === 1 ? "" : "s"}
          </p>
          <div className="mt-auto border-t border-border pt-3">
            <p className="font-semibold">Best Self story</p>
            {story ? (
              <p className="mt-1 line-clamp-3 text-muted">{String(story.data?.title || story.data?.story || "Submitted")}</p>
            ) : (
              <p className="mt-1 text-muted">Not written yet.</p>
            )}
            <Link href="/me/story" className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-2" })}>
              <PenLine size={14} aria-hidden /> {story ? "View your story" : "Write your story"}
            </Link>
          </div>
        </GlassCard>
      </div>

      <Section title="Trophy case" description={`${earned.size} of ${TROPHY_DEFS.length} earned. Trophies mark real milestones, never clicks.`}>
        <GlassCard>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TROPHY_DEFS.map((t) => (
              <li key={t.id} className="flex justify-center">
                <TrophyBadge tier={t.tier} title={t.name} description={t.description} locked={!earned.has(t.id)} size="sm" />
              </li>
            ))}
          </ul>
        </GlassCard>
      </Section>

      <Section title="30/60/90 scorecard" description={items.length ? "Agreed with your manager. Reviewed at each check-in." : "Proposed goals. You agree them with your manager in weeks 1-2."}>
        <div className="grid gap-3 md:grid-cols-3">
          {([30, 60, 90] as const).map((h) => (
            <GlassCard key={h} className="flex flex-col gap-3">
              <p className="font-display text-lg font-semibold">Day {h}</p>
              {scorecard.filter((s) => s.horizon === h).length === 0 && <p className="text-sm text-muted">No goals yet.</p>}
              {scorecard
                .filter((s) => s.horizon === h)
                .map((s) => (
                  <div key={s.id} className="flex flex-col gap-1 border-t border-border pt-2 first:border-0 first:pt-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{s.title}</p>
                      <Badge tone={SC_STATUS[s.status]?.tone ?? "neutral"}>{s.agreed ? SC_STATUS[s.status]?.label : "Proposed"}</Badge>
                    </div>
                    <p className="text-xs text-muted">Target: {s.target}</p>
                  </div>
                ))}
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section title="Certificates">
        <div className="grid gap-3 sm:grid-cols-2">
          {certs.map((c) => (
            <GlassCard key={c.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {c.earned ? <Award size={20} aria-hidden className="text-gold" /> : <Lock size={18} aria-hidden className="text-muted" />}
                <p className="font-medium">{c.title}</p>
              </div>
              {c.earned ? (
                <a href={`/api/certificate/${c.id}`} className={buttonStyles({ size: "sm", className: "self-start" })} download>
                  <Download size={14} aria-hidden /> Download PDF
                </a>
              ) : (
                <p className="text-sm text-muted">{c.how}</p>
              )}
            </GlassCard>
          ))}
        </div>
      </Section>
    </>
  );
}
