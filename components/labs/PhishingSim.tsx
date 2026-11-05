"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, Flag, Forward, Link2, Mail, MousePointerClick, Paperclip, Reply, ShieldAlert, Trash2 } from "lucide-react";
import { submitPhishing } from "@/app/(hire)/labs/actions";
import { useReward } from "@/components/app/useReward";
import type { PhishingEmail } from "@/content/schema";
import { Badge, Button, GlassCard, cn, useToast } from "@/components/ui";
import type { PhishAction } from "./scoring";
import type { PhishSubmitResult } from "./types";

type Result = Extract<PhishSubmitResult, { ok: true }>;

// All actions look the same, so the styling doesn't hint at the answer.
const ACTIONS: { id: PhishAction; label: string; icon: ReactNode; variant: "secondary" }[] = [
  { id: "report", label: "Report phish", icon: <ShieldAlert size={16} aria-hidden />, variant: "secondary" },
  { id: "click", label: "Click the button", icon: <MousePointerClick size={16} aria-hidden />, variant: "secondary" },
  { id: "reply", label: "Reply to IT", icon: <Reply size={16} aria-hidden />, variant: "secondary" },
  { id: "forward", label: "Forward to a colleague", icon: <Forward size={16} aria-hidden />, variant: "secondary" },
  { id: "delete", label: "Just delete it", icon: <Trash2 size={16} aria-hidden />, variant: "secondary" },
];

const WRONG_ACTION: Record<Exclude<PhishAction, "report">, string> = {
  click: "In a real attack, that click could have handed over your password. Nothing happened this time: it's a simulation.",
  reply: "Replying tells the attacker your address is live, and the Reply-To goes to them, not to IT.",
  forward: "Forwarding spreads the risk to a colleague who might click.",
  delete: "Deleting protects you, but Security never hears about it and your colleagues may get the same email.",
};

/** Inbox simulation: mark what looks suspicious, then choose what to do. */
export function PhishingSim({ email, done, lastScore }: { email: PhishingEmail; done: boolean; lastScore?: number }) {
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<Result | null>(null);
  const [lastAction, setLastAction] = useState<PhishAction | null>(null);
  const [pending, start] = useTransition();
  const reward = useReward();
  const { toast } = useToast();
  const router = useRouter();
  const paragraphs = email.body.split(/\n{2,}/);
  const locked = !!result || pending;

  const toggle = (id: string) =>
    setMarked((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const Spot = ({ id, children, className, label }: { id: string; children: ReactNode; className?: string; label: string }) => (
    <button
      type="button"
      aria-pressed={marked.has(id)}
      aria-label={`${marked.has(id) ? "Unmark" : "Mark"} as suspicious: ${label}`}
      disabled={locked}
      onClick={() => toggle(id)}
      className={cn(
        "rounded-md px-1.5 py-1 text-left transition enabled:hover:bg-accent-soft disabled:cursor-default",
        marked.has(id) && "bg-warn-soft ring-2 ring-warn",
        className,
      )}
    >
      {children}
    </button>
  );

  const act = (action: PhishAction) =>
    start(async () => {
      const res = await submitPhishing([...marked], action);
      if (!res.ok) {
        toast({ title: "Could not save", description: res.error, tone: "danger" });
        return;
      }
      setLastAction(action);
      setResult(res);
      if (res.reward) reward(res.reward, "Phish spotted and reported");
      router.refresh();
    });

  const reset = () => {
    setMarked(new Set());
    setResult(null);
    setLastAction(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {done && !result && <p className="text-sm text-success">You reported this one{lastScore !== undefined ? ` (score ${lastScore})` : ""}. Try it again any time for practice.</p>}
      <p className="text-sm text-muted">Tap every part of the email that looks wrong to you. Then decide what to do with it.</p>

      <GlassCard variant="strong" padding="none" className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2 text-xs text-muted">
          <Mail size={14} aria-hidden /> Inbox · 1 unread
        </div>
        <div className="flex flex-col gap-1 border-b border-border p-3 text-sm sm:p-4">
          <Spot id="subject" label="subject line" className="font-display text-base font-semibold">
            {email.subject}
          </Spot>
          <div className="flex flex-wrap items-center gap-x-1">
            <span className="text-muted">From</span>
            <Spot id="from" label="sender">
              <span className="font-medium">{email.fromName}</span> <span className="break-all text-muted">&lt;{email.fromAddress}&gt;</span>
            </Spot>
          </div>
          {email.replyTo && (
            <div className="flex flex-wrap items-center gap-x-1">
              <span className="text-muted">Reply-To</span>
              <Spot id="replyTo" label="reply-to address">
                <span className="break-all">{email.replyTo}</span>
              </Spot>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-3">
            <span className="flex items-center gap-x-1">
              <span className="text-muted">To</span>
              <Spot id="to" label="recipient">
                {email.to}
              </Spot>
            </span>
            <Spot id="sentAt" label="time sent" className="text-muted">
              {email.sentAt}
            </Spot>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-3 text-sm sm:p-4">
          {paragraphs.map((p, i) => (
            <Spot key={i} id={`body-${i}`} label={`paragraph ${i + 1}`} className={cn("whitespace-pre-line", /^\s*\[.*\]\s*$/.test(p) && "self-start rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent")}>
              {p.replace(/^\s*\[\s*(.*?)\s*\]\s*$/, "$1")}
            </Spot>
          ))}
        </div>
        {(email.links.length > 0 || email.attachments.length > 0) && (
          <div className="flex flex-col gap-2 border-t border-border p-3 text-xs sm:p-4">
            {email.links.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <Link2 size={14} aria-hidden className="text-muted" />
                <span className="text-muted">Hover preview: the button goes to</span>
                <Spot id="link" label="link destination">
                  <span className="font-mono break-all">{email.links[0].url}</span>
                </Spot>
              </div>
            )}
            {email.attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <Paperclip size={14} aria-hidden className="text-muted" />
                {email.attachments.map((a) => (
                  <Spot key={a} id="attachment" label={`attachment ${a}`}>
                    <span className="font-mono">{a}</span>
                  </Spot>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <p className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Flag size={12} aria-hidden /> {marked.size} part(s) marked as suspicious
      </p>

      {!result ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIONS.map((a) => (
            <Button key={a.id} variant={a.variant} onClick={() => act(a.id)} disabled={pending} leftIcon={a.icon} className="justify-start">
              {a.label}
            </Button>
          ))}
        </div>
      ) : (
        <GlassCard variant="strong" className="flex flex-col gap-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={result.actionCorrect ? "success" : "danger"}>{result.actionCorrect ? "Reported: the right call" : "Not the right call"}</Badge>
            <Badge tone="neutral">Score {result.score}</Badge>
          </div>
          {!result.actionCorrect && lastAction && lastAction !== "report" && <p className="text-sm">{WRONG_ACTION[lastAction]}</p>}
          {result.reveal ? (
            <>
              <p className="text-sm">
                <span className="font-medium">What to do: </span>
                {result.reveal.correctAction}
              </p>
              <div>
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                  Red flags: you found {result.foundCount} of {result.reveal.flags.length}
                </p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {result.reveal.flags.map((f) => (
                    <li key={f.id} className="flex gap-2">
                      {f.found ? <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-success" /> : <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-warn" />}
                      <span>
                        <span className="font-medium capitalize">{f.where}: </span>
                        {f.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm">
              You spotted {result.foundCount} of {result.foundCount + result.missedCount} red flags. Look at the email again and choose a different action. The full list of red flags appears once you make the right call.
            </p>
          )}
          {result.falseAlarmCount > 0 && <p className="text-xs text-muted">{result.falseAlarmCount} marked part(s) were fine. Suspicion is good, but focus on what really gives an email away.</p>}
          <div>
            <Button variant="secondary" size="sm" onClick={reset}>
              {result.actionCorrect ? "Try it again" : "Try again"}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
