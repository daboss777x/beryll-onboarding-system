import Link from "next/link";
import { BellRing, Bot, CalendarCheck, Flame, PartyPopper, RotateCcw } from "lucide-react";
import { currentStage, loadHireState, nextTasks, nextUnlock } from "@/components/app/hire-state";
import { ReviewDoneButton } from "@/components/app/ReviewDoneButton";
import { PageHeader, Section, TaskRow } from "@/components/app/screen";
import { EmptyState, GlassCard, RankBadge, RANKS, XpBar, buttonStyles } from "@/components/ui";
import { quizById } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { duePulse } from "@/lib/logic";

export const metadata = { title: "Today · Beryll Onboard" };

function greeting(now: Date) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Dublin" }).format(now));
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function TodayPage() {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const [pulses, checkins, reviews, manager] = await Promise.all([
    repo.listPulses(profile.id),
    repo.listCheckins(profile.id),
    repo.listReviewQueue(profile.id, state.programDay),
    profile.managerId ? repo.getProfile(profile.managerId) : Promise.resolve(null),
  ]);
  const first = profile.name.split(" ")[0];
  const stage = currentStage(state);
  const next = nextTasks(state);
  const upcoming = next.length ? undefined : nextUnlock(state);
  const pulseDay = duePulse(state.programDay, pulses.map((p) => p.day));
  const checkin = checkins.find((c) => !c.heldAt && c.dueDay <= state.programDay);

  return (
    <>
      {/* The "Day n · stage" eyebrow is rendered by the (hire) layout (AppShell todayEyebrow) so it shows before this page streams in. */}
      <PageHeader
        title={`${greeting(new Date())}, ${first}`}
        description={stage.subtitle}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <GlassCard variant="prism" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Your rank</p>
              <div className="mt-1 flex items-center gap-2">
                <RankBadge rank={state.rank} />
              </div>
              <p className="mt-1 text-xs text-muted">{RANKS[state.rank].blurb}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface-strong px-3 py-1.5 text-sm font-medium" aria-label={`Streak ${state.streak} days`}>
              <Flame size={16} aria-hidden className={state.streak > 0 ? "text-warn" : "text-muted"} />
              {state.streak} day{state.streak === 1 ? "" : "s"} streak
            </div>
          </div>
          <XpBar xp={state.level.xpIntoLevel} nextAt={state.level.xpForNext} levelLabel={`Level ${state.level.level}`} nextLabel={`level ${state.level.level + 1}`} />
          <Link href="/roadmap" className="text-sm font-medium text-accent hover:underline">
            See the full roadmap
          </Link>
        </GlassCard>

        <GlassCard className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-accent-soft text-accent">
              <Bot size={18} aria-hidden />
            </span>
            <div>
              <p className="font-semibold">Ask Beryl</p>
              <p className="text-xs text-muted">Your SOP coach. It cites its sources.</p>
            </div>
          </div>
          <p className="text-sm text-muted">Stuck on a process or a term? Beryl answers from the SOP hub and tells you who to ask when it does not know.</p>
          {/* TODO(Davis): point at the Ask Beryl chat once Joel's /api/ai/coach UI lands. */}
          <Link href="/learn/ask-beryl-intro" className={buttonStyles({ variant: "secondary", size: "sm", className: "self-start" })}>
            Meet Ask Beryl (chat coming soon)
          </Link>
        </GlassCard>
      </div>

      {(pulseDay || checkin) && (
        <div className="mb-6 flex flex-col gap-3">
          {pulseDay && (
            <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="status">
              <div className="flex items-start gap-3">
                <BellRing size={20} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <p className="font-medium">Your day {pulseDay} pulse is open</p>
                  <p className="text-sm text-muted">Three quick ratings. Two minutes, and it really helps your manager help you.</p>
                </div>
              </div>
              <Link href={`/pulse/${pulseDay}`} className={buttonStyles({ size: "sm" })}>
                Take the pulse
              </Link>
            </GlassCard>
          )}
          {checkin && (
            <GlassCard className="flex items-start gap-3" role="status">
              <CalendarCheck size={20} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="font-medium">
                  {checkin.label} check-in with {manager?.name.split(" ")[0] ?? "your manager"} is due
                </p>
                <p className="text-sm text-muted">
                  Planned for day {checkin.dueDay}. Bring one win, one worry and one question. {manager ? `${manager.name.split(" ")[0]} will book it.` : ""}
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      <Section title="Up next" description={next.length ? "Only what matters now. Everything else waits on the roadmap." : undefined}>
        {next.length ? (
          <GlassCard padding="sm" className="flex flex-col divide-y divide-border">
            {next.map((t) => (
              <TaskRow key={t.id} task={t} status={state.taskStatuses[t.id]} programDay={state.programDay} />
            ))}
          </GlassCard>
        ) : (
          <EmptyState
            icon={<PartyPopper size={26} aria-hidden />}
            title="You are all caught up"
            description={
              upcoming
                ? `Next up: "${upcoming.title}" opens on day ${upcoming.unlockDay}. Enjoy the breathing room.`
                : "Nothing is waiting for you right now. Check the roadmap to see what is coming."
            }
            action={
              <Link href="/roadmap" className={buttonStyles({ variant: "secondary" })}>
                Open the roadmap
              </Link>
            }
          />
        )}
      </Section>

      <Section title="Quick reviews" description="Questions you missed come back after 3, 10 and 30 days so they stick.">
        {reviews.length ? (
          <div className="flex flex-col gap-3">
            <Link href="/review/due" className={`${buttonStyles({ variant: "primary", size: "sm" })} self-start`}>
              Start review session ({reviews.length})
            </Link>
            {reviews.slice(0, 5).map((r) => {
              const q = quizById(r.quizId)?.questions.find((x) => x.id === r.itemId);
              return (
                <GlassCard key={`${r.quizId}-${r.itemId}`} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <RotateCcw size={18} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                    <div>
                      {q?.scenario && <p className="text-sm text-muted">{q.scenario}</p>}
                      <p className="font-medium">{q?.prompt ?? "Review a question you missed"}</p>
                      <p className="mt-0.5 text-xs text-muted">From {quizById(r.quizId)?.title ?? r.quizId}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/quiz/${r.quizId}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
                      Retake quiz
                    </Link>
                    <ReviewDoneButton quizId={r.quizId} itemId={r.itemId} />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted">No reviews due. Missed quiz questions will show up here.</p>
        )}
      </Section>
    </>
  );
}
