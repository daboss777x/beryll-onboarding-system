"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages, Send } from "lucide-react";
import { gradeTranslator } from "@/app/(hire)/labs/actions";
import { useReward } from "@/components/app/useReward";
import type { TranslatorPublic } from "@/content/schema";
import { Badge, Button, GlassCard, ProgressBar, Textarea, cn, useToast } from "@/components/ui";
import { GradeCard } from "./GradeCard";
import type { LabGradeView } from "./types";

interface Item {
  id: string;
  kind: "finding" | "ask";
  title: string;
  prompt: string;
  source: string;
  context: string;
}

const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function TranslatorDrills({ drills, initialBest, passScore, minItems, done }: { drills: TranslatorPublic; initialBest: Record<string, number>; passScore: number; minItems: number; done: boolean }) {
  const items: Item[] = [
    ...drills.findings.map((f) => ({ id: f.id, kind: "finding" as const, title: f.title, prompt: `Rewrite this for the ${f.audience}.`, source: f.engineerText, context: f.context })),
    ...drills.asks.map((a) => ({ id: a.id, kind: "ask" as const, title: a.clientName, prompt: "Turn this ask into a clear scope, plus the questions you would ask first.", source: `"${a.clientQuote}"`, context: a.context })),
  ];
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, LabGradeView>>({});
  const [best, setBest] = useState(initialBest);
  const [pending, start] = useTransition();
  const reward = useReward();
  const { toast } = useToast();
  const router = useRouter();

  if (items.length === 0) return <p className="text-sm text-muted">No drills are loaded yet.</p>;
  const item = items.find((i) => i.id === activeId) ?? items[0];
  const answer = answers[item.id] ?? "";
  const graded = items.filter((i) => typeof best[i.id] === "number").length;

  const submit = () =>
    start(async () => {
      const res = await gradeTranslator(item.id, answer);
      if (!res.ok) {
        toast({ title: res.code === "rate_limited" ? "Daily limit reached" : "Could not grade", description: res.error, tone: res.code === "rate_limited" ? "warn" : "danger" });
        return;
      }
      setGrades((g) => ({ ...g, [item.id]: res.grade }));
      setBest(res.best);
      if (res.reward) reward(res.reward, "Translator drills passed");
      else toast({ title: `Scored ${res.grade.score}`, description: done ? "Practice run: your recorded result is unchanged." : `${Object.keys(res.best).length} of ${minItems} drills needed for your lab score.`, tone: "info" });
      router.refresh();
    });

  const group = (kind: Item["kind"], label: string) => (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items
          .filter((i) => i.kind === kind)
          .map((i) => (
            <button
              key={i.id}
              type="button"
              aria-pressed={i.id === item.id}
              onClick={() => setActiveId(i.id)}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition",
                i.id === item.id ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface hover:border-border-strong",
              )}
            >
              {i.title}
              {typeof best[i.id] === "number" && <Badge tone={best[i.id] >= passScore ? "success" : "warn"}>{best[i.id]}</Badge>}
            </button>
          ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <GlassCard padding="sm" className="flex flex-col gap-2">
        <ProgressBar value={Math.min(100, (graded / minItems) * 100)} label={`${graded} drill(s) with feedback · ${minItems} needed for a lab score`} />
        <p className="text-xs text-muted">Your lab score is the average of your best score on each drill you try. Pass mark {passScore}. Try more drills to raise it.</p>
      </GlassCard>

      <GlassCard className="flex flex-col gap-4">
        {group("finding", "Findings: engineer to client")}
        {group("ask", "Vague asks: client to scope")}
      </GlassCard>

      <GlassCard variant="strong" className="flex flex-col gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
          <Languages size={14} aria-hidden /> {item.kind === "finding" ? "Finding" : "Client ask"} · {item.title}
        </p>
        <p className="font-medium">{item.prompt}</p>
        <pre className="rounded-lg bg-surface-strong p-3 font-mono text-xs whitespace-pre-wrap">{item.source}</pre>
        <p className="text-sm text-muted">{item.context}</p>
        <Textarea
          label="Your answer"
          hint={`${wordCount(answer)} words · aim for 60-150`}
          rows={7}
          maxLength={8000}
          value={answer}
          onChange={(e) => setAnswers((a) => ({ ...a, [item.id]: e.target.value }))}
        />
        <div>
          <Button onClick={submit} loading={pending} disabled={pending || !answer.trim()} leftIcon={<Send size={16} aria-hidden />}>
            Get feedback
          </Button>
        </div>
      </GlassCard>

      {grades[item.id] && <GradeCard grade={grades[item.id]} passScore={passScore} />}
    </div>
  );
}
