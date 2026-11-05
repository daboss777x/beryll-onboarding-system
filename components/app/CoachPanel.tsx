"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, HelpCircle, MessageCircleQuestion, Send, Sparkles, Trash2 } from "lucide-react";
import type { Role } from "@/lib/types";
import { Button, Sheet, Textarea, cn } from "@/components/ui";

/** Same separator as lib/ai/coach.ts COACH_META_SEPARATOR (not imported: that module is server-only). */
const META_SEP = "\u001E";
const OPEN_EVENT = "beryl:open";

interface Citation {
  sopId: string;
  title: string;
}
interface CoachMsg {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  kind?: "answer" | "unknown" | "error" | "limit";
}

const STARTERS: Record<Role, string[]> = {
  hire: ["Can I discount a SOW by 15%?", "Who signs the authorisation to test?", "Can I email a pentest report to the client?", "What do I do if a client says they were breached?"],
  manager: ["What is the discount authority for a BDM?", "What goes in a buddy's first week?", "When does a contract need legal review?"],
  buddy: ["What should a buddy cover in week one?", "How should a hire log a shadowed call?", "Who handles a client incident call?"],
};

/** Open the Ask Beryl panel from anywhere on the page. */
export function openCoach(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { question } }));
}

export function CoachTrigger({ variant = "sidebar" }: { variant?: "sidebar" | "icon" }) {
  if (variant === "icon")
    return (
      <button
        type="button"
        onClick={() => openCoach()}
        aria-label="Ask Beryl"
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-accent hover:bg-accent-soft"
      >
        <MessageCircleQuestion size={20} aria-hidden />
      </button>
    );
  return (
    <Button variant="secondary" className="w-full justify-start" onClick={() => openCoach()} leftIcon={<MessageCircleQuestion size={18} aria-hidden className="text-accent" />}>
      Ask Beryl
    </Button>
  );
}

function classify(answer: string, citations: Citation[]): CoachMsg["kind"] {
  if (!citations.length && /^(i don.t know|i can.t share)/i.test(answer.trim())) return "unknown";
  return "answer";
}

export function CoachPanel({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMsg[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = draft !== null;

  const ask = useCallback(
    async (raw: string) => {
      const question = raw.trim().slice(0, 800);
      if (question.length < 2 || busy || limited) return;
      const history = messages
        .filter((m) => m.kind !== "error" && m.kind !== "limit")
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
      setMessages((ms) => [...ms, { role: "user", content: question }]);
      setInput("");
      setDraft("");
      abort.current = new AbortController();
      try {
        const res = await fetch("/api/ai/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, history }),
          signal: abort.current.signal,
        });
        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
          if (res.status === 429 || body?.code === "rate_limited") {
            setLimited(true);
            setMessages((ms) => [...ms, { role: "assistant", kind: "limit", content: body?.error ?? "You have used today's questions. The limit resets at midnight." }]);
          } else {
            const msg = res.status === 401 ? "Your session has ended. Sign in again to keep asking." : (body?.error ?? "Beryl could not answer just now. Please try again.");
            setMessages((ms) => [...ms, { role: "assistant", kind: "error", content: msg }]);
          }
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          const cut = text.indexOf(META_SEP);
          setDraft(cut >= 0 ? text.slice(0, cut) : text);
        }
        const cut = text.indexOf(META_SEP);
        const answer = (cut >= 0 ? text.slice(0, cut) : text).trim();
        let citations: Citation[] = [];
        if (cut >= 0) {
          try {
            const meta = JSON.parse(text.slice(cut + 1).trim()) as { citations?: Citation[] };
            citations = Array.isArray(meta.citations) ? meta.citations.filter((c) => c && typeof c.title === "string") : [];
          } catch {
            /* meta is best effort */
          }
        }
        setMessages((ms) => [...ms, { role: "assistant", content: answer, citations, kind: classify(answer, citations) }]);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setMessages((ms) => [...ms, { role: "assistant", kind: "error", content: "The connection dropped. Ask again." }]);
      } finally {
        setDraft(null);
      }
    },
    [busy, limited, messages],
  );

  // Open from openCoach() anywhere; an optional question is asked straight away.
  const askRef = useRef(ask);
  useEffect(() => {
    askRef.current = ask;
  });
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<{ question?: string }>).detail?.question;
      if (q) void askRef.current(q);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, draft]);

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Ask Beryl"
      description="Answers come only from Beryll's SOPs, with the source cited. If it is not in an SOP, Beryl says so."
      footer={
        <form
          className="flex w-full flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <Textarea
            label="Your question"
            rows={2}
            maxLength={800}
            value={input}
            disabled={limited}
            data-autofocus
            placeholder={limited ? "Daily limit reached" : "e.g. Who approves a 10% discount?"}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            {messages.length > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setMessages([])}
                leftIcon={<Trash2 size={14} aria-hidden />}
              >
                Clear
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="sm" loading={busy} disabled={input.trim().length < 2 || limited} leftIcon={<Send size={14} aria-hidden />}>
              Ask
            </Button>
          </div>
        </form>
      }
    >
      {messages.length === 0 && !busy ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="flex items-center gap-2 font-medium">
            <Sparkles size={16} aria-hidden className="text-accent" /> Try one of these
          </p>
          <ul className="flex flex-col gap-2">
            {STARTERS[role].map((q) => (
              <li key={q}>
                <button
                  type="button"
                  disabled={limited}
                  onClick={() => void ask(q)}
                  className="min-h-10 cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm hover:bg-surface-strong disabled:opacity-50"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {messages.map((m, i) => (
            <CoachBubble key={i} msg={m} role={role} />
          ))}
          {busy && (
            <li className="max-w-[90%] rounded-2xl bg-surface-strong px-4 py-2.5 text-sm whitespace-pre-wrap">
              {draft ? draft : <span className="animate-pulse text-muted">Looking through the SOPs…</span>}
            </li>
          )}
        </ol>
      )}
      <div ref={endRef} />
    </Sheet>
  );
}

function CoachBubble({ msg, role }: { msg: CoachMsg; role: Role }) {
  if (msg.role === "user")
    return (
      <li className="flex justify-end">
        <p className="max-w-[90%] rounded-2xl bg-accent px-4 py-2.5 text-sm whitespace-pre-wrap text-on-accent">
          <span className="sr-only">You: </span>
          {msg.content}
        </p>
      </li>
    );
  const tone =
    msg.kind === "error" ? "bg-danger-soft text-text" : msg.kind === "limit" ? "bg-warn-soft text-text" : msg.kind === "unknown" ? "border border-dashed border-border-strong bg-surface" : "bg-surface-strong";
  return (
    <li className={cn("max-w-[90%] rounded-2xl px-4 py-2.5 text-sm", tone)}>
      <span className="sr-only">Beryl: </span>
      {msg.kind === "unknown" && (
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
          <HelpCircle size={14} aria-hidden /> Not in the SOPs
        </p>
      )}
      <p className="whitespace-pre-wrap">{msg.content}</p>
      {msg.kind === "unknown" && role === "hire" && (
        <p className="mt-2 text-xs text-muted">Your buddy is the right person for this one. Questions like this are exactly what they are there for.</p>
      )}
      {msg.citations && msg.citations.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Sources">
          {msg.citations.map((c) => (
            <li key={c.sopId}>
              <span title={`SOP: ${c.sopId}`} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                <BookOpen size={12} aria-hidden /> {c.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
