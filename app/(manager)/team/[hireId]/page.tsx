import Link from "next/link";
import { AlertTriangle, ArrowLeft, Award, CalendarCheck, CheckCircle2, ClipboardCheck, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { loadHireSummary } from "@/components/app/manager-data";
import { CheckinEditor, ObservationForm, QaForm, SignOffForm } from "@/components/app/ManagerForms";
import { PULSE_QUESTIONS } from "@/components/app/pulse-copy";
import { Callout, NotFoundPanel, PageHeader, Section } from "@/components/app/screen";
import { Badge, GlassCard, ProgressBar, RankBadge, Stat, cn, type BadgeTone } from "@/components/ui";
import { stages, taskById } from "@/content";
import { rubric } from "@/content/server";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { getManagedHire } from "@/components/app/hire-state";
import { AI_PASS_SCORE, MANAGER_MIN_CRITERION, PULSE_DAYS, TROPHY_DEFS } from "@/lib/logic";

export const metadata = { title: "Hire · Beryll Onboard" };

/** Check-ins can be written up from a week before they are due. */
const CHECKIN_EDIT_LEAD = 7;
/** QA sampling: the manager scores 1 in 5 finished submissions. */
const QA_SAMPLE_EVERY = 5;
const QA_KINDS = new Set(["lab", "walkthrough", "roleplay", "quiz", "mission"]);

const STAGE_TONE: Record<string, BadgeTone> = { done: "success", active: "aqua", locked: "neutral" };

interface ObsShape {
  scores?: { id?: string; criterion: string; score: number }[];
  notes?: string;
  coaching?: string[];
  failedCount?: number;
  passed?: boolean;
  note?: string;
}

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" }) : "");

export default async function HireDetailPage({ params }: { params: Promise<{ hireId: string }> }) {
  const { hireId } = await params;
  const manager = await requireUser("manager");
  const repo = await getRepo();
  const hire = await getManagedHire(repo, manager, hireId);
  if (!hire) {
    return <NotFoundPanel title="Hire not found" description="This person is not on your team, or the link is out of date." href="/team" label="Back to your team" />;
  }
  const s = await loadHireSummary(repo, hire);
  const { state } = s;
  const [scorecard, sessions] = await Promise.all([repo.listScorecardItems(hire.id), repo.listRoleplaySessions(hire.id)]);
  const day90 = await repo.getCertification(hire.id, "days61-90");
  const first = hire.name.split(" ")[0];
  const day = state.programDay;

  // Certification
  const cert = state.certification;
  const obs = (cert?.managerObservation ?? {}) as ObsShape;
  const latestCertSession = sessions.filter((x) => x.isCertification && typeof x.overall === "number").sort((a, b) => b.at.localeCompare(a.at))[0];
  const aiScore = cert?.aiScore ?? latestCertSession?.overall;
  const certLocked = state.stageStatuses["days8-30"] === "locked";
  const criteria = rubric.criteria.map((c) => ({ id: c.id, label: c.label, question: c.question }));
  const initialScores = Object.fromEntries(
    (obs.scores ?? []).map((x) => [x.id ?? rubric.criteria.find((c) => c.label === x.criterion)?.id ?? x.criterion, x.score]),
  );

  // QA sampling: real (not seeded or demo-skipped) finished work, oldest first, every 5th sampled.
  const qaPool = state.progress
    .filter((p) => p.status === "done" && !p.data?.synthetic && !p.data?.demoSkipped && QA_KINDS.has(taskById(p.taskId)?.kind ?? ""))
    .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""));
  const qaSample = qaPool.filter((_, i) => i % QA_SAMPLE_EVERY === 0);

  const story = state.progress.find((p) => p.taskId === "day1-best-self" && p.status === "done");
  const storyText = typeof story?.data?.story === "string" ? (story.data.story as string) : undefined;
  const signOffOpen = state.certificationPassed && day >= 61;

  return (
    <>
      <Link href="/team" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} aria-hidden /> Team
      </Link>
      <PageHeader
        eyebrow={day === 0 ? "Pre-boarding" : `Day ${day} · ${s.stageTitle}`}
        title={hire.name}
        description={`${hire.title} · started ${fmtDate(hire.startDate)}`}
        actions={<RankBadge rank={state.rank} />}
      />

      {s.risks.length > 0 && (
        <GlassCard className="mb-6 border-l-4 border-l-warn">
          <p className="mb-2 flex items-center gap-1.5 font-semibold text-warn">
            <AlertTriangle size={16} aria-hidden /> At risk
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {s.risks.map((r) => (
              <li key={r.reason}>
                <p className="font-medium">{r.detail}</p>
                <p className="text-muted">Try: {r.suggestedAction}</p>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <Section title="Progress">
        <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Required steps" value={`${s.percent}%`} />
          <Stat label="XP" value={state.xp} hint={`Level ${state.level.level}`} icon={<Sparkles size={16} aria-hidden />} />
          <Stat label="Streak" value={`${state.streak} day${state.streak === 1 ? "" : "s"}`} />
          <Stat label="Trophies" value={`${state.earnedTrophyIds.length} of ${TROPHY_DEFS.length}`} icon={<Award size={16} aria-hidden />} />
        </div>
        <GlassCard padding="sm">
          <ol className="divide-y divide-border">
            {stages.map((st) => (
              <li key={st.id} className="flex items-center justify-between gap-3 px-2 py-2.5 text-sm">
                <span className={cn("min-w-0", state.stageStatuses[st.id] === "locked" && "text-muted")}>
                  <span className="font-medium">{st.title}</span> <span className="text-xs text-muted">· days {st.startDay}-{st.endDay}</span>
                </span>
                <Badge tone={STAGE_TONE[state.stageStatuses[st.id]]} dot>
                  {state.stageStatuses[st.id] === "done" ? "Done" : state.stageStatuses[st.id] === "active" ? "Active" : "Locked"}
                </Badge>
              </li>
            ))}
          </ol>
        </GlassCard>
      </Section>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <GlassCard className="flex flex-col gap-3">
          <p className="font-semibold">Pulses</p>
          {PULSE_DAYS.map((d) => {
            const p = s.pulses.find((x) => x.day === d);
            if (!p)
              return (
                <p key={d} className="flex items-center justify-between text-sm">
                  <span>Day {d}</span>
                  <span className="text-muted">{day >= d ? "Not sent yet" : `Opens day ${d}`}</span>
                </p>
              );
            return (
              <div key={d} className="flex flex-col gap-1.5 border-t border-border pt-2 first-of-type:border-0">
                <p className="text-sm font-medium">Day {d}</p>
                <ul className="flex flex-wrap gap-2">
                  {PULSE_QUESTIONS.map((q) => (
                    <li key={q.id}>
                      <Badge tone={p[q.id] <= 2 ? "danger" : p[q.id] >= 4 ? "success" : "neutral"}>
                        {q.label} {p[q.id]}/5
                      </Badge>
                    </li>
                  ))}
                </ul>
                {p.comment && <p className="text-sm text-muted">&ldquo;{p.comment}&rdquo;</p>}
              </div>
            );
          })}
        </GlassCard>
        <GlassCard className="flex flex-col gap-2">
          <p className="font-semibold">Best Self story</p>
          {storyText ? (
            <p className="line-clamp-6 text-sm whitespace-pre-line text-muted">{storyText}</p>
          ) : (
            <p className="text-sm text-muted">{story ? "Submitted before the demo data started." : day >= 1 ? `${first} has not written it yet.` : "Written on day 1."}</p>
          )}
          {scorecard.length > 0 && (
            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 font-semibold">30/60/90 scorecard</p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {scorecard.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-2">
                    <span>
                      <span className="text-xs text-muted">Day {i.horizon} · </span>
                      {i.goal}
                    </span>
                    <Badge tone={i.status === "done" ? "success" : i.status === "at_risk" ? "warn" : i.status === "on_track" ? "aqua" : "neutral"}>{i.status.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GlassCard>
      </div>

      <Section id="checkins" title="Check-ins" description="Day 1, week 1, every two weeks, and days 30, 60 and 90.">
        <ul className="grid gap-3 md:grid-cols-2">
          {s.checkins.map((c) => {
            const held = Boolean(c.heldAt);
            const overdue = !held && c.dueDay < day;
            const editable = c.dueDay <= day + CHECKIN_EDIT_LEAD;
            return (
              <li key={c.dueDay}>
                <GlassCard className={cn("flex h-full flex-col gap-3", !editable && "opacity-75")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 font-medium">
                      <CalendarCheck size={16} aria-hidden className="text-muted" /> {c.label} <span className="text-xs font-normal text-muted">· day {c.dueDay}</span>
                    </p>
                    <Badge tone={held ? "success" : overdue ? "danger" : c.dueDay <= day ? "aqua" : "neutral"}>
                      {held ? `Held ${fmtDate(c.heldAt)}` : overdue ? "Overdue" : c.dueDay <= day ? "Due" : "Upcoming"}
                    </Badge>
                  </div>
                  {c.agenda && c.agenda.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-muted">
                      {c.agenda.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  )}
                  {editable ? (
                    <CheckinEditor hireId={hire.id} dueDay={c.dueDay} label={c.label} held={held} notes={c.notes} />
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <Lock size={14} aria-hidden /> Notes open from day {Math.max(0, c.dueDay - CHECKIN_EDIT_LEAD)}.
                    </p>
                  )}
                </GlassCard>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="certification" title="Certification" description={`Certified when the AI role-play scores ${AI_PASS_SCORE}+ and every criterion you observe is ${MANAGER_MIN_CRITERION}/5 or higher.`}>
        {certLocked ? (
          <GlassCard className="flex items-center gap-3 text-sm text-muted">
            <Lock size={18} aria-hidden /> Opens when {first} reaches the days 8-30 stage.
          </GlassCard>
        ) : state.certificationPassed ? (
          <GlassCard variant="prism" className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 font-semibold text-success">
              <ShieldCheck size={18} aria-hidden /> Certified for solo client contact
            </p>
            <p className="text-sm">
              AI role-play: {aiScore ?? "n/a"}/100{cert?.signedAt ? ` · signed ${fmtDate(cert.signedAt)}` : ""}
            </p>
            {obs.scores && obs.scores.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {obs.scores.map((x) => (
                  <li key={x.criterion}>
                    <Badge tone="success">
                      {x.criterion} {x.score}/5
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {(obs.notes || obs.note) && <p className="text-sm text-muted">{obs.notes || obs.note}</p>}
          </GlassCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <GlassCard className="flex flex-col gap-3">
              <p className="font-semibold">AI role-play</p>
              {aiScore === undefined ? (
                <p className="text-sm text-muted">{first} has not done the certification role-play yet. You can record your observation now; the decision follows the AI score.</p>
              ) : (
                <>
                  <ProgressBar value={aiScore} label={`Score ${aiScore}/100 (needs ${AI_PASS_SCORE})`} />
                  <Badge tone={aiScore >= AI_PASS_SCORE ? "success" : "danger"} className="self-start">
                    {aiScore >= AI_PASS_SCORE ? "AI part passed" : "Below the bar"}
                  </Badge>
                  {latestCertSession?.aiSummary && <p className="text-sm text-muted">{latestCertSession.aiSummary}</p>}
                </>
              )}
              {cert?.status === "retest" && (
                <Callout tone="warning">
                  <p className="mb-1 font-medium">Retest needed{obs.failedCount ? ` (attempt ${obs.failedCount} not passed)` : ""}</p>
                  {obs.coaching && obs.coaching.length > 0 && (
                    <ul className="list-disc pl-4">
                      {obs.coaching.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                </Callout>
              )}
            </GlassCard>
            <GlassCard>
              <p className="mb-3 font-semibold">Your observation</p>
              <ObservationForm hireId={hire.id} criteria={criteria} initial={initialScores} initialNotes={obs.notes} />
            </GlassCard>
          </div>
        )}
      </Section>

      <Section id="qa" title="QA sampling" description={`You score 1 in ${QA_SAMPLE_EVERY} pieces of finished work after certification.`}>
        {!state.certificationPassed ? (
          <GlassCard className="flex items-center gap-3 text-sm text-muted">
            <Lock size={18} aria-hidden /> Starts once {first} is certified.
          </GlassCard>
        ) : qaSample.length === 0 ? (
          <GlassCard className="flex items-center gap-3 text-sm text-muted">
            <ClipboardCheck size={18} aria-hidden /> No finished labs, walkthroughs or quizzes to sample yet. They appear here as {first} completes them.
          </GlassCard>
        ) : (
          <GlassCard padding="sm">
            <p className="px-2 pb-2 text-xs text-muted">
              {qaSample.length} sampled of {qaPool.length} submissions
            </p>
            <ul className="divide-y divide-border">
              {qaSample.map((p) => {
                const t = taskById(p.taskId);
                const qaScore = typeof p.data?.qaScore === "number" ? (p.data.qaScore as number) : undefined;
                return (
                  <li key={p.taskId} className="flex flex-col gap-2 px-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{t?.title ?? p.taskId}</span>
                      <span className="flex items-center gap-2 text-xs text-muted">
                        {p.score !== undefined && <span>Auto score {p.score}</span>}
                        {qaScore !== undefined && <Badge tone="success">QA {qaScore}</Badge>}
                      </span>
                    </div>
                    <QaForm hireId={hire.id} taskId={p.taskId} score={qaScore} notes={typeof p.data?.qaNotes === "string" ? (p.data.qaNotes as string) : undefined} />
                  </li>
                );
              })}
            </ul>
          </GlassCard>
        )}
      </Section>

      <Section id="signoff" title="Day-90 sign-off" description="After the 90-day conversation. Moves the rank to Independent and unlocks the day-90 certificate.">
        {state.day90SignedOff ? (
          <GlassCard variant="prism" className="flex flex-col gap-1">
            <p className="flex items-center gap-1.5 font-semibold text-success">
              <CheckCircle2 size={18} aria-hidden /> Signed off{day90?.signedAt ? ` on ${fmtDate(day90.signedAt)}` : ""}
            </p>
            {typeof day90?.managerObservation?.note === "string" && day90.managerObservation.note && <p className="text-sm text-muted">{day90.managerObservation.note}</p>}
          </GlassCard>
        ) : signOffOpen ? (
          <GlassCard>
            <SignOffForm hireId={hire.id} firstName={first} />
          </GlassCard>
        ) : (
          <GlassCard className="flex items-center gap-3 text-sm text-muted">
            <Lock size={18} aria-hidden /> {state.certificationPassed ? `Opens on day 61 (${first} is on day ${day}).` : `${first} needs to be certified first.`}
          </GlassCard>
        )}
      </Section>
    </>
  );
}
