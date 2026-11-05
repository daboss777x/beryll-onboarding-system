"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, Highlighter, Scale, Send } from "lucide-react";
import { gradeRedline } from "@/app/(hire)/labs/actions";
import { useReward } from "@/components/app/useReward";
import { REDLINE_CATEGORIES, type RedlineContract } from "@/content/schema";
import { Badge, Button, Checkbox, GlassCard, ProgressBar, Select, Textarea, cn, useToast } from "@/components/ui";
import { GradeCard } from "./GradeCard";
import type { LabGradeView } from "./types";

interface FlagDraft {
  category: string;
  note: string;
  escalate: boolean;
}

const CATEGORY_LABEL: Record<string, string> = { ip: "Intellectual property", data_transfer: "Data transfer", scope_change: "Scope change", auto_renewal: "Auto-renewal" };
const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ");

export function RedlineLab({ contracts, initialBest, passScore, done }: { contracts: RedlineContract[]; initialBest: Record<string, number>; passScore: number; done: boolean }) {
  const [activeId, setActiveId] = useState(contracts[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, Record<string, FlagDraft>>>({});
  const [grades, setGrades] = useState<Record<string, LabGradeView>>({});
  const [best, setBest] = useState(initialBest);
  const [labScore, setLabScore] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const reward = useReward();
  const { toast } = useToast();
  const router = useRouter();

  if (contracts.length === 0) return <p className="text-sm text-muted">No contracts are loaded for this lab yet.</p>;
  const contract = contracts.find((c) => c.id === activeId) ?? contracts[0];
  const flags = drafts[contract.id] ?? {};
  const gradedCount = contracts.filter((c) => typeof best[c.id] === "number").length;

  const setFlags = (next: Record<string, FlagDraft>) => setDrafts((d) => ({ ...d, [contract.id]: next }));
  const toggle = (clauseId: string) => {
    const next = { ...flags };
    if (next[clauseId]) delete next[clauseId];
    else next[clauseId] = { category: "", note: "", escalate: false };
    setFlags(next);
  };
  const edit = (clauseId: string, patch: Partial<FlagDraft>) => setFlags({ ...flags, [clauseId]: { ...flags[clauseId], ...patch } });

  const submit = () =>
    start(async () => {
      const res = await gradeRedline(
        contract.id,
        Object.entries(flags).map(([clauseId, f]) => ({ clauseId, category: f.category || undefined, note: f.note, escalate: f.escalate })),
      );
      if (!res.ok) {
        toast({ title: res.code === "rate_limited" ? "Daily limit reached" : "Could not grade", description: res.error, tone: res.code === "rate_limited" ? "warn" : "danger" });
        return;
      }
      setGrades((g) => ({ ...g, [contract.id]: res.grade }));
      setBest(res.best);
      setLabScore(res.labScore);
      if (res.reward) reward(res.reward, "Redline Lab passed");
      else toast({ title: `Scored ${res.grade.score}`, description: done ? "Practice run: your recorded result is unchanged." : `${Object.keys(res.best).length} of ${contracts.length} contracts reviewed.`, tone: "info" });
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <GlassCard padding="sm" className="flex flex-col gap-2">
        <ProgressBar value={(gradedCount / contracts.length) * 100} label={`${gradedCount} of ${contracts.length} contracts reviewed`} />
        <p className="text-xs text-muted">
          Your lab score is the average of your best score on each contract, once all three are reviewed. Pass mark {passScore}.
          {labScore !== null && <span className="font-medium text-text"> Current lab score: {labScore}.</span>}
        </p>
      </GlassCard>

      <div role="tablist" aria-label="Contracts" className="flex gap-2 overflow-x-auto pb-1">
        {contracts.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === contract.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition",
              c.id === contract.id ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface hover:border-border-strong",
            )}
          >
            <span className="font-medium">{c.docType}</span>
            <span className="hidden sm:inline">{c.client}</span>
            {typeof best[c.id] === "number" && <Badge tone={best[c.id] >= passScore ? "success" : "warn"}>{best[c.id]}</Badge>}
          </button>
        ))}
      </div>

      <GlassCard className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-wide text-accent uppercase">
          {contract.docType} · {contract.client}
        </p>
        <h2 className="font-display text-lg font-semibold">{contract.title}</h2>
        <p className="text-sm text-muted">{contract.brief}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
          <Highlighter size={14} aria-hidden /> Tap a clause to highlight it, then say what is wrong and whether it goes to legal.
        </p>
      </GlassCard>

      <ol className="flex flex-col gap-3">
        {contract.clauses.map((cl) => {
          const f = flags[cl.id];
          return (
            <li key={cl.id}>
              <GlassCard padding="none" className={cn("overflow-hidden transition", f && "border-warn shadow-glow")}>
                <button
                  type="button"
                  aria-pressed={!!f}
                  onClick={() => toggle(cl.id)}
                  className={cn("flex w-full flex-col gap-1 p-4 text-left transition hover:bg-accent-soft/40", f && "bg-warn-soft")}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{cl.heading}</span>
                    {f ? (
                      <Badge tone="warn">
                        <Flag size={12} aria-hidden /> Flagged
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">Tap to flag</span>
                    )}
                  </span>
                  <span className="text-sm text-muted">{cl.text}</span>
                </button>
                {f && (
                  <div className="flex flex-col gap-3 border-t border-border p-4">
                    <Select label="Risk category" value={f.category} onChange={(e) => edit(cl.id, { category: e.target.value })}>
                      <option value="">Choose a category</option>
                      {REDLINE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabel(c)}
                        </option>
                      ))}
                    </Select>
                    <Textarea
                      label="What is wrong, and the fix you would ask for"
                      rows={3}
                      maxLength={560}
                      value={f.note}
                      onChange={(e) => edit(cl.id, { note: e.target.value })}
                      placeholder="e.g. Unlimited liability for us only. Ask for a cap at 12 months' fees."
                    />
                    <Checkbox
                      label={
                        <span className="inline-flex items-center gap-1.5">
                          <Scale size={14} aria-hidden /> Escalate to legal review
                        </span>
                      }
                      checked={f.escalate}
                      onChange={(e) => edit(cl.id, { escalate: e.target.checked })}
                    />
                  </div>
                )}
              </GlassCard>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} loading={pending} disabled={pending || Object.keys(flags).length === 0} leftIcon={<Send size={16} aria-hidden />}>
          Submit {contract.docType} for feedback
        </Button>
        <span className="text-xs text-muted">{Object.keys(flags).length} clause(s) flagged</span>
      </div>

      {grades[contract.id] && <GradeCard grade={grades[contract.id]} passScore={passScore} title={`${contract.docType} feedback`} />}
    </div>
  );
}
