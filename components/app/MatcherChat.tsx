"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Lock, RotateCcw, Send, Sparkles, SkipForward } from "lucide-react";
import { completeMatcherTask, saveMatcherVisibility } from "@/app/(hire)/actions";
import { Avatar, Badge, Button, Checkbox, GlassCard, ProgressBar, Textarea, cn } from "@/components/ui";
import { MeetButton } from "./PeopleForms";
import { sortVisibilityKeys, visibilityLabel } from "./people-copy";
import { useActionToast } from "./useActionToast";
import { useReward } from "./useReward";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export interface MatcherSuggestionView {
  staffId: string;
  name: string;
  title: string;
  team: string;
  reason: string;
  icebreaker: string;
  avatarSeed?: string;
}

export interface MatcherResultView {
  interests: string[];
  visibility: Record<string, boolean>;
  suggestions: MatcherSuggestionView[];
}

const MAX_QUESTIONS = 10;
const MIN_QUESTIONS = 6;

async function readError(res: Response): Promise<{ message: string; rateLimited: boolean }> {
  const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
  if (res.status === 429 || body?.code === "rate_limited") return { message: body?.error ?? "You have used today's matcher limit. Try again tomorrow.", rateLimited: true };
  if (res.status === 401) return { message: "Your session has ended. Sign in again to continue.", rateLimited: false };
  return { message: body?.error ?? "Something went wrong. Please try again.", rateLimited: false };
}

export function MatcherChat({ initial, plannedCoffee }: { initial: MatcherResultView | null; plannedCoffee: string[] }) {
  const [result, setResult] = useState<MatcherResultView | null>(initial);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [asked, setAsked] = useState(0);
  const [canFinish, setCanFinish] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const reward = useReward();
  const router = useRouter();
  const started = messages.length > 0 || streaming;

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, draft]);

  async function turn(history: Msg[]) {
    setError(null);
    setStreaming(true);
    setDraft("");
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/ai/matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, action: "turn" }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const e = await readError(res);
        setError(e.message);
        setRateLimited(e.rateLimited);
        return;
      }
      setAsked(Number(res.headers.get("X-Questions-Asked") ?? 0));
      setCanFinish(res.headers.get("X-Can-Finish") === "true");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setDraft(text);
      }
      setMessages([...history, { role: "assistant", content: text.trim() }]);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("The connection dropped. Send your answer again.");
    } finally {
      setDraft("");
      setStreaming(false);
    }
  }

  function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    const next = [...messages, { role: "user" as const, content: content.slice(0, 2000) }];
    setMessages(next);
    setInput("");
    void turn(next);
  }

  async function finish() {
    setError(null);
    setFinishing(true);
    try {
      const res = await fetch("/api/ai/matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, action: "finish" }),
      });
      if (!res.ok) {
        const e = await readError(res);
        setError(e.message);
        setRateLimited(e.rateLimited);
        return;
      }
      const data = (await res.json()) as { suggestions: MatcherSuggestionView[]; profile: { interests: string[]; visibility: Record<string, boolean> } };
      setResult({ interests: data.profile.interests, visibility: data.profile.visibility, suggestions: data.suggestions });
      setMessages([]);
      reward(await completeMatcherTask(), "Matches found");
      router.refresh();
    } catch {
      setError("We could not reach the matcher. Please try again.");
    } finally {
      setFinishing(false);
    }
  }

  if (result && !started) {
    return (
      <MatcherResults
        result={result}
        plannedCoffee={plannedCoffee}
        onRedo={() => {
          setAsked(0);
          setCanFinish(false);
          void turn([]);
        }}
        redoDisabled={rateLimited}
      />
    );
  }

  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";
  const outOfQuestions = asked >= MAX_QUESTIONS && lastIsAssistant;

  return (
    <div className="flex flex-col gap-4">
      {!started ? (
        <GlassCard variant="prism" className="flex flex-col items-start gap-3">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles size={18} aria-hidden className="text-accent" /> How it works
          </p>
          <ul className="list-disc pl-5 text-sm text-muted">
            <li>Six to ten short questions about what you enjoy and how you like to work.</li>
            <li>Type &ldquo;skip&rdquo; for anything you would rather not answer.</li>
            <li>Nothing is shown to colleagues until you choose to share it.</li>
          </ul>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button onClick={() => void turn([])} disabled={rateLimited} leftIcon={<Sparkles size={16} aria-hidden />}>
            Start the chat
          </Button>
        </GlassCard>
      ) : (
        <GlassCard className="flex flex-col gap-4">
          <ProgressBar value={Math.min(100, (Math.max(asked, 1) / MAX_QUESTIONS) * 100)} label={`Question ${Math.min(asked, MAX_QUESTIONS)} of up to ${MAX_QUESTIONS}${asked < MIN_QUESTIONS ? ` · finish unlocks after ${MIN_QUESTIONS}` : ""}`} />
          <ol className="flex flex-col gap-3" aria-live="polite">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.content} />
            ))}
            {streaming && <Bubble role="assistant" text={draft} typing={!draft} />}
          </ol>
          <div ref={endRef} />
          {error && (
            <p role="alert" className="rounded-md bg-danger-soft p-3 text-sm text-danger">
              {error}
            </p>
          )}
          {outOfQuestions ? (
            <p className="text-sm text-muted">That is all the questions. Press Finish to see your matches.</p>
          ) : (
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <Textarea
                label="Your answer"
                rows={2}
                value={input}
                maxLength={2000}
                disabled={streaming || finishing || rateLimited || !lastIsAssistant}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={!input.trim() || streaming || !lastIsAssistant || rateLimited} leftIcon={<Send size={14} aria-hidden />}>
                  Send
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={streaming || !lastIsAssistant || rateLimited} onClick={() => send("skip")} leftIcon={<SkipForward size={14} aria-hidden />}>
                  Skip
                </Button>
              </div>
            </form>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button onClick={() => void finish()} disabled={!canFinish || streaming || rateLimited} loading={finishing} leftIcon={<Sparkles size={16} aria-hidden />}>
              Finish and see my matches
            </Button>
            {!canFinish && <span className="text-xs text-muted">Answer a few more questions first.</span>}
            {result && (
              <Button variant="ghost" size="sm" onClick={() => { abort.current?.abort(); setMessages([]); }}>
                Back to my matches
              </Button>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function Bubble({ role, text, typing }: { role: Msg["role"]; text: string; typing?: boolean }) {
  const mine = role === "user";
  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <p className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap", mine ? "bg-accent text-on-accent" : "bg-surface-strong text-text")}>
        <span className="sr-only">{mine ? "You: " : "Matcher: "}</span>
        {typing ? <span className="animate-pulse text-muted">Thinking…</span> : text}
      </p>
    </li>
  );
}

function MatcherResults({ result, plannedCoffee, onRedo, redoDisabled }: { result: MatcherResultView; plannedCoffee: string[]; onRedo: () => void; redoDisabled: boolean }) {
  const [vis, setVis] = useState(result.visibility);
  const [saved, setSaved] = useState(result.visibility);
  const [pending, start] = useTransition();
  const notify = useActionToast();
  const router = useRouter();
  const keys = sortVisibilityKeys(Object.keys(result.visibility));
  const dirty = keys.some((k) => !!vis[k] !== !!saved[k]);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="matches-h">
        <h2 id="matches-h" className="mb-3 font-display text-lg font-semibold">
          Three people to meet
        </h2>
        {result.suggestions.length ? (
          <ul className="grid gap-3 md:grid-cols-3">
            {result.suggestions.map((s) => (
              <li key={s.staffId}>
                <GlassCard className="flex h-full flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} seed={s.avatarSeed} size={44} />
                    <div className="min-w-0">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted">
                        {s.title}
                        {s.team && ` · ${s.team}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">{s.reason}</p>
                  <p className="flex gap-2 rounded-md bg-accent-soft p-3 text-sm">
                    <Lightbulb size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                    <span>
                      <span className="font-medium">Icebreaker: </span>
                      {s.icebreaker}
                    </span>
                  </p>
                  <div className="mt-auto">
                    <MeetButton staffId={s.staffId} firstName={s.name.split(" ")[0]} planned={plannedCoffee.includes(s.staffId)} />
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No matches this time. Redo the chat with a little more detail.</p>
        )}
      </section>

      <GlassCard className="flex flex-col gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Lock size={18} aria-hidden className="text-accent" /> What colleagues can see
          </h2>
          <p className="text-sm text-muted">Everything starts private. Tick what you are happy to share on your profile.</p>
        </div>
        {result.interests.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Interests we picked up">
            {result.interests.map((i) => (
              <li key={i}>
                <Badge tone="aqua">{i}</Badge>
              </li>
            ))}
          </ul>
        )}
        <fieldset className="flex flex-col">
          <legend className="sr-only">Visibility</legend>
          {keys.map((k) => (
            <Checkbox key={k} label={visibilityLabel(k)} checked={!!vis[k]} onChange={(e) => setVis((v) => ({ ...v, [k]: e.target.checked }))} />
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            loading={pending}
            disabled={!dirty}
            onClick={() =>
              start(async () => {
                if (notify(await saveMatcherVisibility(vis), "Privacy saved")) setSaved(vis);
                router.refresh();
              })
            }
          >
            Save privacy
          </Button>
          <Button size="sm" variant="ghost" onClick={onRedo} disabled={redoDisabled} leftIcon={<RotateCcw size={14} aria-hidden />}>
            Redo the interview
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
