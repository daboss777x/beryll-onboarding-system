import Link from "next/link";
import { Award, Bot, CheckCircle2, Clock, Download, Eye, Lock, Sparkles } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { PageHeader, Section, TaskStatusBadge } from "@/components/app/screen";
import { CertificationRunner } from "@/components/practice/CertificationRunner";
import { CRITERION_LABEL } from "@/components/practice/RoleplayResultCard";
import { Badge, EmptyState, GlassCard, buttonStyles, type BadgeTone } from "@/components/ui";
import { personaById, tasks } from "@/content";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { AI_PASS_SCORE, MANAGER_MIN_CRITERION } from "@/lib/logic";

export const metadata = { title: "Certification · Beryll Onboard" };

const CERT_PERSONA_ID = "cert-healthtech";
const STATUS: Record<"none" | "pending" | "passed" | "retest", { label: string; tone: BadgeTone; text: string }> = {
  none: { label: "Not started", tone: "neutral", text: "Take the AI role-play when you're ready. Your manager books the live observation with you." },
  pending: { label: "Pending", tone: "aqua", text: "One part is in. The decision is made when both the AI role-play and your manager's observation are recorded." },
  passed: { label: "Passed", tone: "success", text: "You're certified for solo client contact. Well done." },
  retest: { label: "Retest", tone: "warn", text: "Not this time. Use the coaching plan below, then retake the part that fell short." },
};

interface ObservationView {
  scores: { criterion: string; id?: string; score: number }[];
  coaching: string[];
}

function observationOf(raw: Record<string, unknown> | undefined): ObservationView | null {
  if (!raw || !Array.isArray(raw.scores)) return null;
  const scores = raw.scores.filter((s): s is ObservationView["scores"][number] => !!s && typeof s.criterion === "string" && typeof s.score === "number");
  const coaching = Array.isArray(raw.coaching) ? raw.coaching.filter((c): c is string => typeof c === "string") : [];
  return scores.length ? { scores, coaching } : null;
}

export default async function CertificationPage() {
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const task = tasks.find((t) => t.kind === "certification");
  const persona = personaById(CERT_PERSONA_ID);
  const status = task ? state.taskStatuses[task.id] : "locked";
  const cert = state.certification;
  const certStatus = state.certificationPassed ? "passed" : (cert?.status ?? "none");
  const s = STATUS[certStatus];
  const observation = observationOf(cert?.managerObservation);
  const sessions = (await repo.listRoleplaySessions(profile.id)).filter((x) => x.isCertification).sort((a, b) => b.at.localeCompare(a.at));
  const aiScore = cert?.aiScore ?? sessions[0]?.overall;

  return (
    <article className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Days 8-30" title="Certification for solo client contact" description="Two parts, one rubric. Pass both and you can talk to clients on your own." actions={task ? <TaskStatusBadge status={status} /> : undefined} />
      {task && (
        <p className="-mt-3 mb-6 flex flex-wrap gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden /> {task.estMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles size={12} aria-hidden /> {task.xp} XP
          </span>
        </p>
      )}

      <Section title="How it works">
        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard className="flex flex-col gap-2">
            <Bot size={20} aria-hidden className="text-accent" />
            <p className="font-medium">1. AI client role-play</p>
            <p className="text-sm text-muted">A fixed client and scenario, scored on six criteria. You need an overall score of {AI_PASS_SCORE} or more.</p>
            <p className="text-sm">{typeof aiScore === "number" ? <Badge tone={aiScore >= AI_PASS_SCORE ? "success" : "warn"}>Latest score {aiScore}</Badge> : <Badge tone="neutral">Not taken yet</Badge>}</p>
          </GlassCard>
          <GlassCard className="flex flex-col gap-2">
            <Eye size={20} aria-hidden className="text-accent" />
            <p className="font-medium">2. Manager observation</p>
            <p className="text-sm text-muted">Your manager watches a live client conversation and scores the same six criteria. Every criterion needs {MANAGER_MIN_CRITERION}/5 or more.</p>
            <p className="text-sm">{observation ? <Badge tone={observation.scores.every((x) => x.score >= MANAGER_MIN_CRITERION) ? "success" : "warn"}>Observation recorded</Badge> : <Badge tone="neutral">Not observed yet</Badge>}</p>
          </GlassCard>
        </div>
      </Section>

      <Section title="Your status">
        <GlassCard variant={certStatus === "passed" ? "prism" : "default"} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={s.tone} dot>
              {s.label}
            </Badge>
            {cert && cert.attempts > 0 && <span className="text-xs text-muted">AI attempts: {cert.attempts}</span>}
          </div>
          <p className="text-sm">{s.text}</p>
          {observation && (
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {observation.scores.map((x) => (
                <li key={x.criterion} className="flex justify-between gap-2 rounded-md bg-surface-strong px-3 py-1.5">
                  <span>{CRITERION_LABEL[x.id ?? ""] ?? x.criterion}</span>
                  <span className={x.score >= MANAGER_MIN_CRITERION ? "text-success" : "text-warn"}>{x.score}/5</span>
                </li>
              ))}
            </ul>
          )}
          {certStatus === "retest" && observation && observation.coaching.length > 0 && (
            <div className="rounded-lg bg-warn-soft p-3 text-sm">
              <p className="mb-1 font-medium">Coaching plan</p>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {observation.coaching.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {certStatus === "passed" && (
            <div className="flex flex-wrap gap-2">
              <a href="/api/certificate/day30" target="_blank" rel="noopener" className={buttonStyles({})}>
                <Download size={16} aria-hidden /> Day-30 certificate (PDF)
              </a>
              <Link href="/me" className={buttonStyles({ variant: "secondary" })}>
                <Award size={16} aria-hidden /> See your rank
              </Link>
            </div>
          )}
        </GlassCard>
      </Section>

      {certStatus !== "passed" && (
        <Section title="The AI role-play" description="Practise with the three practice clients first. They use the same rubric.">
          {status === "locked" || !task ? (
            <EmptyState
              icon={<Lock size={24} aria-hidden />}
              title="Not open yet"
              description={task?.unlockDay && task.unlockDay > state.programDay ? `Certification opens on day ${task.unlockDay}. You're on day ${state.programDay}.` : "Finish the earlier steps on your roadmap first."}
              action={
                <Link href="/practice/roleplay" className={buttonStyles({ variant: "secondary" })}>
                  Practise a client call
                </Link>
              }
            />
          ) : !persona ? (
            <EmptyState title="Certification client unavailable" description="The certification scenario isn't loaded. Tell your manager." />
          ) : cert?.status === "pending" && typeof cert.aiScore === "number" && cert.aiScore >= AI_PASS_SCORE ? (
            <GlassCard className="flex items-start gap-3 text-sm">
              <CheckCircle2 size={18} aria-hidden className="mt-0.5 shrink-0 text-success" />
              <p>Your AI role-play passed with {cert.aiScore}. Next: your manager&rsquo;s live observation.</p>
            </GlassCard>
          ) : (
            <CertificationRunner persona={persona} passMark={AI_PASS_SCORE} />
          )}
        </Section>
      )}
    </article>
  );
}
