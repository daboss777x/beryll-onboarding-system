import Link from "next/link";
import { CheckCircle2, Clock, Eye, EyeOff, Heart, Lock, MessageCircleHeart, NotebookPen, Sparkles, Users } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { MeetButton, QuestRequestForm, ShadowLogForm } from "@/components/app/PeopleForms";
import { groupByTeam } from "@/components/app/people-copy";
import { PageHeader, Section, TaskStatusBadge } from "@/components/app/screen";
import { Avatar, Badge, EmptyState, GlassCard, ProgressBar, buttonStyles } from "@/components/ui";
import { staff as contentStaff, staffById, taskById } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";

export const metadata = { title: "People · Beryll Onboard" };

const CONNECTOR_TARGET = 3;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short" });

export default async function PeoplePage() {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const [state, staffRows, kudos, shadowLogs, matcher] = await Promise.all([
    loadHireState(repo, profile),
    repo.listStaff().catch(() => []),
    repo.listKudos(profile.id),
    repo.listShadowLogs(profile.id),
    repo.getMatcherProfile(profile.id),
  ]);
  const staff = staffRows.length ? staffRows : contentStaff;
  const staffMap = new Map(staff.map((s) => [s.id, s]));
  const quests = [...state.quests].sort((a, b) => Number(!!a.confirmedAt) - Number(!!b.confirmedAt) || b.createdAt.localeCompare(a.createdAt));
  const confirmed = quests.filter((q) => q.confirmedAt).length;
  const coffeePlanned = new Set(quests.filter((q) => q.type === "coffee" && q.staffId).map((q) => q.staffId!));
  const suggested = new Set(matcher?.suggestions.map((s) => s.staffId) ?? []);

  const received = kudos.filter((k) => k.toId === profile.id);
  const senderNames = await Promise.all(
    received.map(async (k) => k.fromName ?? staffById(k.fromId)?.name ?? (await repo.getProfile(k.fromId).catch(() => null))?.name ?? "A colleague"),
  );

  const matcherTask = taskById("day1-matcher");
  const matcherStatus = matcherTask ? state.taskStatuses[matcherTask.id] : undefined;
  const questTasks = ["day1-meet-buddy", "d60-cross-team"].map((id) => taskById(id)).filter((t) => !!t);
  const staffOptions = staff.map((s) => ({ id: s.id, name: s.name, team: s.team }));
  const visibleCount = matcher ? Object.values(matcher.visibility).filter(Boolean).length : 0;

  return (
    <div>
      <PageHeader
        eyebrow="People and connection"
        title="Your people at Beryll"
        description="Who is who, the people you have met, kudos from your colleagues and what you learned shadowing them. All optional, all worth it."
        actions={
          <Link href="/people/matcher" className={buttonStyles({ size: "sm" })}>
            <Sparkles size={16} aria-hidden /> People matcher
          </Link>
        }
      />

      {/* Matcher summary */}
      <GlassCard variant="prism" className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles size={18} aria-hidden className="text-accent" /> {matcher ? "Your matcher suggestions" : "Find three people to meet"}
          </p>
          {matcher ? (
            <>
              <ul className="mt-2 flex flex-wrap gap-2">
                {matcher.suggestions.map((s) => (
                  <li key={s.staffId}>
                    <Badge tone="aqua">{staffMap.get(s.staffId)?.name ?? s.staffId}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                {visibleCount ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
                {visibleCount ? `${visibleCount} profile item${visibleCount === 1 ? "" : "s"} visible to colleagues` : "Your matcher profile is private"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">A ten-minute chat about you. We suggest three colleagues, with a reason and an icebreaker for each.</p>
          )}
        </div>
        {matcherStatus === "locked" && !matcher ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <Lock size={14} aria-hidden /> Opens on day {matcherTask?.unlockDay ?? 1}
          </span>
        ) : (
          <Link href="/people/matcher" className={buttonStyles({ variant: matcher ? "secondary" : "primary", size: "sm", className: "shrink-0" })}>
            {matcher ? "See matches and privacy" : "Start the chat"}
          </Link>
        )}
      </GlassCard>

      {/* Quests */}
      <Section id="quests" title="Meet-the-team quests" description="Ask to meet someone. Your buddy ticks it off once it has happened, not you.">
        <GlassCard className="mb-4 flex flex-col gap-4">
          <ProgressBar value={Math.min(100, (confirmed / CONNECTOR_TARGET) * 100)} label={`${confirmed} confirmed · ${Math.max(0, CONNECTOR_TARGET - confirmed) ? `${CONNECTOR_TARGET - confirmed} more for the Connector trophy` : "Connector trophy unlocked"}`} />
          {questTasks.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Roadmap quests">
              {questTasks.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {t.title} {!t.required && <span className="text-xs text-muted">(optional)</span>}
                  </span>
                  <TaskStatusBadge status={state.taskStatuses[t.id]} />
                </li>
              ))}
            </ul>
          )}
          <QuestRequestForm staff={staffOptions} />
        </GlassCard>

        {quests.length ? (
          <ul className="flex flex-col gap-2">
            {quests.map((q) => {
              const person = q.staffId ? staffMap.get(q.staffId) : undefined;
              return (
                <li key={q.id}>
                  <GlassCard padding="sm" className="flex items-center gap-3">
                    <Avatar name={person?.name ?? q.title} seed={person?.avatarSeed} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{q.title}</p>
                      <p className="text-xs text-muted">{person ? `${person.title} · ${person.team}` : "Colleague"}</p>
                    </div>
                    {q.confirmedAt ? (
                      <Badge tone="success" dot>
                        <CheckCircle2 size={12} aria-hidden /> Confirmed {fmtDate(q.confirmedAt)}
                      </Badge>
                    ) : (
                      <Badge tone="warn" dot>
                        <Clock size={12} aria-hidden /> Waiting for your buddy
                      </Badge>
                    )}
                  </GlassCard>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<Users size={26} aria-hidden />} title="No quests yet" description="Pick someone below and plan a coffee. Three confirmed quests earn the Connector trophy." />
        )}
      </Section>

      {/* Kudos */}
      <Section id="kudos" title="Kudos for you" description="Thanks and recognition from your colleagues.">
        {received.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {received.map((k, i) => (
              <li key={k.id}>
                <GlassCard className="flex h-full flex-col gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
                    <Heart size={14} aria-hidden /> {k.kind === "founder" ? "From a founder" : k.kind === "manager" ? "From your manager" : "Kudos"}
                  </p>
                  <p className="text-sm">&ldquo;{k.message}&rdquo;</p>
                  <p className="mt-auto text-xs text-muted">
                    {senderNames[i]} · {fmtDate(k.at)}
                  </p>
                </GlassCard>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<MessageCircleHeart size={26} aria-hidden />} title="No kudos yet" description="They will turn up. Help on a scoping call or ask a good question and someone usually notices." />
        )}
      </Section>

      {/* Shadow log */}
      <Section
        id="shadow-log"
        title="Shadow log"
        description="Sit in on real client work and write down what you saw. Debrief it with your buddy."
        action={
          <Link href="/checklist/shadow-log" className="text-sm font-medium text-accent hover:underline">
            The 5 required
          </Link>
        }
      >
        <GlassCard className="mb-4">
          <ShadowLogForm staff={staffOptions} />
        </GlassCard>
        {shadowLogs.length ? (
          <ol className="flex flex-col gap-2">
            {shadowLogs.map((l) => (
              <li key={l.id}>
                <GlassCard padding="sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{l.interaction}</p>
                    <span className="text-xs text-muted">{fmtDate(l.at)}</span>
                  </div>
                  {l.withWhom && <p className="text-xs text-muted">With {l.withWhom}</p>}
                  {l.notes && <p className="mt-1.5 text-sm">{l.notes}</p>}
                </GlassCard>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={<NotebookPen size={26} aria-hidden />} title="Nothing logged yet" description="After your first shadowed call, add who you were with and one thing they did well." />
        )}
      </Section>

      {/* People map */}
      <Section id="map" title="People map" description={`${staff.length} colleagues across ${groupByTeam(staff).length} teams.`}>
        <div className="flex flex-col gap-6">
          {groupByTeam(staff).map((g) => (
            <div key={g.team}>
              <h3 className="mb-2 text-sm font-semibold text-muted">{g.team}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {g.people.map((s) => (
                  <li key={s.id}>
                    <GlassCard className="flex h-full flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar name={s.name} seed={s.avatarSeed} size={44} />
                        <div className="min-w-0">
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted">{s.title}</p>
                          {suggested.has(s.id) && (
                            <Badge tone="aqua" className="mt-1">
                              <Sparkles size={12} aria-hidden /> Suggested for you
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">{s.bio}</p>
                      <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
                        {s.interests.map((i) => (
                          <li key={i}>
                            <Badge>{i}</Badge>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted">{s.availabilityNote}</p>
                      <div className="mt-auto">
                        <MeetButton staffId={s.id} firstName={s.name.split(" ")[0]} planned={coffeePlanned.has(s.id)} />
                      </div>
                    </GlassCard>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
