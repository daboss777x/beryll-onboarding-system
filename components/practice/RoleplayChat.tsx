"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneOff, RotateCcw, Send } from "lucide-react";
import { recordRoleplayPractice } from "@/app/(hire)/practice/actions";
import { useReward } from "@/components/app/useReward";
import type { PersonaCard } from "@/content/schema";
import { Avatar, Badge, Button, GlassCard, Textarea, cn, useToast } from "@/components/ui";
import type { RoleplayResult } from "@/lib/types";
import { endSession, RoleplayError, sendTurn, type CertificationOutcome } from "./roleplay-client";
import { RoleplayResultCard } from "./RoleplayResultCard";

interface Line {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 12;
const MAX_CHARS = 2000;
const NOT_ASSESSED_NOTE = "Not enough to assess yet. Keep the conversation going: respond to the client properly, then end the call.";
const NOT_ASSESSED_NO_TURNS = "Not enough to assess, and this call has no replies left. Start a new call and respond to the client properly.";

/**
 * Text role-play with a client persona. The transcript lives here for display only;
 * the server keeps its own copy keyed by sessionId and grades that.
 */
export function RoleplayChat({
  persona,
  certification = false,
  passMark,
  onCertification,
}: {
  persona: PersonaCard;
  certification?: boolean;
  passMark?: number;
  onCertification?: (c: CertificationOutcome | undefined) => void;
}) {
  const [lines, setLines] = useState<Line[]>([{ role: "assistant", content: persona.openingMessage }]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnsLeft, setTurnsLeft] = useState(MAX_TURNS);
  const [streaming, setStreaming] = useState(false);
  const [banner, setBanner] = useState<{ tone: "warn" | "danger" | "info"; text: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const [result, setResult] = useState<RoleplayResult | null>(null);
  const [needsAiGrade, setNeedsAiGrade] = useState(false);
  const [locked, setLocked] = useState(false);
  const [stuck, setStuck] = useState(false); // not assessed with no turns left: only a new call helps
  const [ending, startEnding] = useTransition();
  const reward = useReward();
  const { toast } = useToast();
  const router = useRouter();
  const bottom = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [lines.length, result]);

  const userTurns = lines.filter((l) => l.role === "user").length;
  const canSend = !streaming && !ended && !locked && !ending && turnsLeft > 0 && draft.trim().length > 0;
  const canEnd = !streaming && !ended && !locked && !stuck && !ending && userTurns > 0 && !!sessionId;

  const handleError = (e: unknown) => {
    if (!(e instanceof RoleplayError)) {
      setBanner({ tone: "danger", text: "Something went wrong. Please try again." });
      return;
    }
    if (e.code === "turn_limit") {
      setTurnsLeft(0);
      setBanner({ tone: "info", text: "That's the end of this conversation. Press End & score to get your feedback." });
    } else if (e.code === "session_ended") {
      setEnded(true);
      setBanner({ tone: "warn", text: "This call has already ended. Start a new call to practise again." });
    } else if (e.code === "cert_locked") {
      setLocked(true);
      setBanner({ tone: "info", text: e.message });
    } else if (e.code === "rate_limited" || e.code === "cert_limit") {
      setBanner({ tone: "warn", text: e.message });
    } else {
      setBanner({ tone: "danger", text: e.message });
    }
  };

  const send = async () => {
    const message = draft.trim().slice(0, MAX_CHARS);
    if (!message || !canSend) return;
    setBanner(null);
    setDraft("");
    setLines((l) => [...l, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);
    abort.current = new AbortController();
    try {
      const meta = await sendTurn(
        { personaId: persona.id, message, sessionId, certification },
        (chunk) =>
          setLines((l) => {
            const copy = l.slice();
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          }),
        abort.current.signal,
      );
      if (meta.sessionId) setSessionId(meta.sessionId);
      if (meta.turnsLeft !== null) setTurnsLeft(meta.turnsLeft);
      else setTurnsLeft((t) => Math.max(0, t - 1));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      // Drop the empty reply; keep the hire's message out of the transcript so it can be resent.
      setLines((l) => {
        const copy = l.slice();
        if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].content) copy.pop();
        if (copy[copy.length - 1]?.role === "user" && copy[copy.length - 1].content === message) copy.pop();
        return copy;
      });
      setDraft(message);
      handleError(e);
    } finally {
      setStreaming(false);
    }
  };

  const end = () =>
    startEnding(async () => {
      if (!sessionId) return;
      setBanner(null);
      try {
        const res = await endSession(sessionId);
        if (res.assessment === "not_assessed") {
          // The server kept the session open and saved nothing: same call, keep talking.
          if (turnsLeft === 0) setStuck(true);
          setBanner({ tone: "info", text: turnsLeft === 0 ? NOT_ASSESSED_NO_TURNS : NOT_ASSESSED_NOTE });
          return;
        }
        setEnded(true);
        setResult(res.result);
        setNeedsAiGrade(!!res.certification?.needsAiGrade);
        if (certification) {
          onCertification?.(res.certification);
        } else {
          const r = await recordRoleplayPractice(res.sessionId);
          if (r.ok) reward(r, "Practice call complete");
          else toast({ title: "Feedback ready, but not saved", description: r.error, tone: "warn" });
        }
        router.refresh();
      } catch (e) {
        handleError(e);
      }
    });

  const restart = () => {
    abort.current?.abort();
    setLines([{ role: "assistant", content: persona.openingMessage }]);
    setDraft("");
    setSessionId(null);
    setTurnsLeft(MAX_TURNS);
    setBanner(null);
    setEnded(false);
    setResult(null);
    setNeedsAiGrade(false);
    setStuck(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <GlassCard padding="none" className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-3 sm:p-4">
          <Avatar name={persona.name} seed={persona.avatarSeed} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{persona.name}</p>
            <p className="truncate text-xs text-muted">
              {persona.role}, {persona.company}
            </p>
          </div>
          <Badge tone={turnsLeft <= 3 ? "warn" : "neutral"}>{turnsLeft} turns left</Badge>
        </div>

        <div className="flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto p-3 sm:p-4" aria-live="polite" aria-busy={streaming}>
          {lines.map((l, i) => (
            <div key={i} className={cn("flex", l.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                  l.role === "user" ? "rounded-br-sm bg-accent text-on-accent" : "rounded-bl-sm bg-surface-strong",
                )}
              >
                <span className="sr-only">{l.role === "user" ? "You: " : `${persona.name}: `}</span>
                {l.content || <span className="text-muted">typing…</span>}
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>

        {banner && (
          <p role="status" className={cn("mx-3 mb-3 rounded-lg p-3 text-sm sm:mx-4", banner.tone === "danger" ? "bg-danger-soft" : banner.tone === "warn" ? "bg-warn-soft" : "bg-accent-soft")}>
            {banner.text}
          </p>
        )}

        {!ended && !locked && !stuck && (
          <form
            className="flex flex-col gap-2 border-t border-border p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Textarea
              label="Your reply"
              rows={3}
              maxLength={MAX_CHARS}
              value={draft}
              disabled={turnsLeft === 0 || ending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={turnsLeft === 0 ? "No turns left. End the call for feedback." : "Type your reply. Enter sends, Shift+Enter for a new line."}
            />
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={end} loading={ending} disabled={!canEnd} leftIcon={<PhoneOff size={14} aria-hidden />}>
                End &amp; score
              </Button>
              <Button type="submit" size="sm" loading={streaming} disabled={!canSend} leftIcon={<Send size={14} aria-hidden />}>
                Send
              </Button>
            </div>
          </form>
        )}
      </GlassCard>

      {ending && <p className="text-sm text-muted">Scoring your call against the six criteria…</p>}
      {result && <RoleplayResultCard result={result} passMark={passMark} needsAiGrade={needsAiGrade} title={certification ? "Certification role-play, scored" : undefined} />}
      {((ended && !certification) || stuck) && (
        <div>
          <Button variant="secondary" onClick={restart} leftIcon={<RotateCcw size={16} aria-hidden />}>
            Start a new call
          </Button>
        </div>
      )}
    </div>
  );
}
