"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import type { PersonaCard } from "@/content/schema";
import { Badge, Button, GlassCard } from "@/components/ui";
import type { CertificationOutcome } from "./roleplay-client";
import { RoleplayChat } from "./RoleplayChat";

const STATUS_COPY: Record<CertificationOutcome["status"], { tone: "success" | "warn" | "aqua"; title: string; text: string }> = {
  passed: { tone: "success", title: "Certified", text: "Both parts are passed. Your day-30 certificate is ready." },
  pending: { tone: "aqua", title: "AI part recorded", text: "Your manager's live observation completes the decision. You'll see the result here." },
  retest: { tone: "warn", title: "Retest", text: "Not this time. Work through the coaching plan, then try again." },
};

const QUICK_CHECK_COPY = { tone: "aqua" as const, title: "Quick check recorded", text: "Your call looked on track. The full AI grade or your manager's review confirms this part." };

/** Runs the fixed certification role-play (certification:true) and shows the outcome the server recorded. */
export function CertificationRunner({ persona, passMark }: { persona: PersonaCard; passMark: number }) {
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);
  const [outcome, setOutcome] = useState<CertificationOutcome | null>(null);

  if (!started) {
    return (
      <GlassCard variant="strong" className="flex flex-col items-start gap-3">
        <p className="text-sm">
          You&rsquo;ll chat with <span className="font-medium">{persona.name}</span>, {persona.role} at {persona.company}. Everyone gets the same client and scenario, so the bar is the same for every hire.
        </p>
        <p className="text-sm text-muted">{persona.situation}</p>
        <p className="text-xs text-muted">Up to 12 replies. You can take the certification call up to 3 times a day.</p>
        <Button onClick={() => setStarted(true)} leftIcon={<PlayCircle size={16} aria-hidden />}>
          Start the certification call
        </Button>
      </GlassCard>
    );
  }

  const copy = outcome ? (outcome.needsAiGrade && outcome.status === "pending" ? QUICK_CHECK_COPY : STATUS_COPY[outcome.status]) : null;
  return (
    <div className="flex flex-col gap-4">
      <RoleplayChat key={run} persona={persona} certification passMark={passMark} onCertification={(c) => setOutcome(c ?? null)} />
      {copy && outcome && (
        <GlassCard className="flex flex-col items-start gap-2" aria-live="polite">
          <Badge tone={copy.tone}>{copy.title}</Badge>
          <p className="text-sm">{copy.text}</p>
          {outcome.decision?.coaching && outcome.decision.coaching.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
              {outcome.decision.coaching.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
          {outcome.status !== "passed" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setOutcome(null);
                setRun((r) => r + 1);
              }}
            >
              Take the call again
            </Button>
          )}
        </GlassCard>
      )}
    </div>
  );
}
