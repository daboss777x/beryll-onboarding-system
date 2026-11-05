import { CalendarDays, Heart, HeartHandshake, MessagesSquare, Sparkles } from "lucide-react";
import { ConfirmQuestButton, KudosForm } from "@/components/app/BuddyForms";
import { PageHeader, Section } from "@/components/app/screen";
import { Avatar, Badge, EmptyState, GlassCard, Stat } from "@/components/ui";
import { shadowLogChecklist, staffById, stages } from "@/content";
import { getRepo, type Repository } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { getProgramDay, stageForDay } from "@/lib/logic";

export const metadata = { title: "Buddy · Beryll Onboard" };

/** What a buddy does, by the hire's program day (§4.5). */
const WEEK_PLAN: { from: number; to: number; items: string[] }[] = [
  { from: 0, to: 0, items: ["Send a short welcome message before day 1.", "Block 30 minutes for coffee on their first morning."] },
  { from: 1, to: 1, items: ["Coffee at 09:30 and a walk round the office.", "Confirm the Meet your buddy quest once you have talked.", "Read their Best Self story when it comes in."] },
  { from: 2, to: 14, items: ["Invite them to two or three shadow sessions this week.", "Hold a 15-minute debrief after each one (prompts below).", "Introduce them to one person outside Commercial."] },
  { from: 15, to: 30, items: ["Run a practice client call with them before certification.", "Ask how they are really feeling ahead of the day-30 pulse."] },
  { from: 31, to: 60, items: ["Suggest a partner for the cross-team quest.", "Point them at one SOP that could be clearer for their Fix-one-SOP mission."] },
  { from: 61, to: 90, items: ["Ask what they would tell the next new hire.", "Plan something small to mark 90 days."] },
  { from: 91, to: 9999, items: ["Keep a monthly coffee in the diary."] },
];

const KUDOS_STARTERS = ["Great questions on the scoping call today.", "Thanks for spotting that clause.", "Calm under pressure with that client."];

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export default async function BuddyPage() {
  const buddy = await requireUser("buddy");
  const repo: Repository = await getRepo();
  const hire = await repo.getBuddyHire(buddy.id);
  const first = buddy.name.split(" ")[0];

  if (!hire) {
    return (
      <>
        <PageHeader eyebrow="Buddy" title={`Hi ${first}`} />
        <EmptyState
          icon={<HeartHandshake size={26} aria-hidden />}
          title="No new hire assigned yet"
          description="When you are paired with someone, they appear here with what to do each week."
        />
      </>
    );
  }

  const day = getProgramDay({ startDate: hire.startDate, demoDayOffset: hire.demoDayOffset }, new Date());
  const stage = stageForDay(stages, day);
  const hireFirst = hire.name.split(" ")[0];
  // Buddies see a limited view; reads beyond the summary may be blocked by RLS, so they fall back to empty.
  const [quests, shadowLogs, kudos] = await Promise.all([
    safe(repo.listQuests(hire.hireId), []),
    safe(repo.listShadowLogs(hire.hireId), []),
    safe(repo.listKudos(buddy.id), []),
  ]);
  const open = quests.filter((q) => !q.confirmedAt);
  const confirmed = quests.filter((q) => q.confirmedAt);
  const sent = kudos.filter((k) => k.fromId === buddy.id && k.toId === hire.hireId);
  const plan = WEEK_PLAN.find((w) => day >= w.from && day <= w.to)?.items ?? [];
  const nextPlan = WEEK_PLAN.find((w) => w.from > day);

  return (
    <>
      <PageHeader eyebrow="Buddy" title={`Hi ${first}`} description={`You are ${hireFirst}'s buddy: the person they can ask anything, without judgement.`} />

      <GlassCard variant="prism" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Avatar name={hire.name} src={hire.avatarUrl} size={56} />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{hire.name}</p>
            <p className="text-sm text-muted">{hire.title}</p>
            <p className="mt-1 text-xs text-muted">
              {day === 0 ? "Starts soon" : `Day ${day}`}
              {stage ? ` · ${stage.title}` : ""}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:ml-auto sm:w-72">
          <Stat label="Steps done" value={hire.tasksDone} />
          <Stat label="Quests to confirm" value={open.length} />
        </div>
      </GlassCard>

      <Section title="This week" description={day === 0 ? "Before day 1." : `Day ${day}.`}>
        <GlassCard className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {plan.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <CalendarDays size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>
          {nextPlan && <p className="border-t border-border pt-3 text-xs text-muted">Coming up from day {nextPlan.from}: {nextPlan.items[0]}</p>}
        </GlassCard>
      </Section>

      <Section id="quests" title="Quests to confirm" description={`Confirm only what really happened. Each one gives ${hireFirst} XP.`}>
        {open.length === 0 ? (
          <GlassCard className="text-sm text-muted">
            {quests.length === 0 ? `${hireFirst} has no quests yet. They pick people to meet from the People page.` : "All caught up. Nothing waiting for you."}
          </GlassCard>
        ) : (
          <GlassCard padding="sm">
            <ul className="divide-y divide-border">
              {open.map((q) => {
                const who = q.staffId ? staffById(q.staffId) : undefined;
                return (
                  <li key={q.id} className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{q.title}</p>
                      {who && <p className="text-xs text-muted">{who.title} · {who.team}</p>}
                    </div>
                    <ConfirmQuestButton questId={q.id} title={q.title} />
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}
        {confirmed.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            {confirmed.length} confirmed so far: {confirmed.map((q) => q.title).join(", ")}.
          </p>
        )}
      </Section>

      <Section id="debriefs" title="Shadow debriefs" description="Fifteen minutes after each shadow session. Use these prompts.">
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 font-semibold">
              <MessagesSquare size={16} aria-hidden className="text-accent" /> Prompts
            </p>
            <ul className="flex flex-col gap-2 text-sm">
              {shadowLogChecklist.items.map((i) => (
                <li key={i.id}>
                  <span className="font-medium">{i.title}:</span> <span className="text-muted">{i.detail}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="flex flex-col gap-3">
            <p className="font-semibold">Logged by {hireFirst}</p>
            {shadowLogs.length === 0 ? (
              <p className="text-sm text-muted">{day < 2 ? "Shadowing starts on day 2." : `No sessions logged yet. Invite ${hireFirst} to your next client call.`}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {shadowLogs.map((l) => (
                  <li key={l.id} className="flex items-start justify-between gap-2">
                    <span>{l.interaction}</span>
                    <Badge tone="aqua">Debrief</Badge>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </Section>

      <Section title="Kudos" description="Specific praise, early and often. It is the fastest way to build belonging.">
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard>
            <KudosForm firstName={hireFirst} starters={KUDOS_STARTERS} />
          </GlassCard>
          <GlassCard className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 font-semibold">
              <Heart size={16} aria-hidden className="text-accent" /> You have sent
            </p>
            {sent.length === 0 ? (
              <p className="text-sm text-muted">Nothing yet. One line is plenty.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {sent.slice(0, 6).map((k) => (
                  <li key={k.id} className="rounded-md bg-surface-strong p-2.5">
                    {k.message}
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Sparkles size={12} aria-hidden /> {new Date(k.at).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </Section>
    </>
  );
}
