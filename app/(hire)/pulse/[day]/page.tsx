import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";
import { loadHireState } from "@/components/app/hire-state";
import { PULSE_QUESTIONS } from "@/components/app/pulse-copy";
import { PulseForm } from "@/components/app/PulseForm";
import { NotFoundPanel, PageHeader } from "@/components/app/screen";
import { EmptyState, GlassCard, ProgressBar, buttonStyles } from "@/components/ui";
import { getRepo } from "@/lib/data";
import { requireUser } from "@/lib/data/auth";
import { PULSE_DAYS } from "@/lib/logic";

export const metadata = { title: "Pulse · Beryll Onboard" };

const INTRO: Record<number, string> = {
  7: "One week in. Three quick ratings so your manager knows how it is really going.",
  30: "A month in. How clear, confident and connected do you feel?",
  90: "Ninety days. One last pulse for your onboarding.",
};

export default async function PulsePage({ params }: { params: Promise<{ day: string }> }) {
  const { day: raw } = await params;
  const day = Number(raw);
  if (!PULSE_DAYS.includes(day as (typeof PULSE_DAYS)[number])) {
    return <NotFoundPanel title="Pulse not found" description={`Pulses run on days ${PULSE_DAYS.join(", ")}.`} />;
  }
  const profile = await requireUser("hire");
  const repo = await getRepo();
  const state = await loadHireState(repo, profile);
  const pulse = (await repo.listPulses(profile.id)).find((p) => p.day === day);

  return (
    <article className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Pulse survey" title={`Day ${day} pulse`} description={INTRO[day]} />

      {pulse ? (
        <GlassCard className="flex flex-col gap-4">
          <p className="flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 size={18} aria-hidden /> Sent on {new Date(pulse.submittedAt).toLocaleDateString("en-IE", { day: "numeric", month: "long" })}
          </p>
          {PULSE_QUESTIONS.map((q) => (
            <ProgressBar key={q.id} value={(pulse[q.id] / 5) * 100} label={`${q.label}: ${pulse[q.id]} of 5`} />
          ))}
          {pulse.comment && <p className="rounded-md bg-surface-strong p-3 text-sm">&ldquo;{pulse.comment}&rdquo;</p>}
          <p className="text-sm text-muted">Your manager will pick this up at your next check-in.</p>
          <Link href="/today" className={buttonStyles({ variant: "secondary", size: "sm", className: "self-start" })}>
            Back to Today
          </Link>
        </GlassCard>
      ) : state.programDay < day ? (
        <EmptyState
          icon={<Lock size={24} aria-hidden />}
          title={`Opens on day ${day}`}
          description={`You are on day ${state.programDay}. We will remind you on Today when it is time.`}
          action={
            <Link href="/today" className={buttonStyles({ variant: "secondary" })}>
              Back to Today
            </Link>
          }
        />
      ) : (
        <GlassCard>
          <PulseForm day={day} />
        </GlassCard>
      )}
    </article>
  );
}
