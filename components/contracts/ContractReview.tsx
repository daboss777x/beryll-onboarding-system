"use client";

import { useState } from "react";
import { CircleCheck, Flag, Gavel, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, GlassCard, Select, Textarea, cn, useToast } from "@/components/ui";
import { emitTour } from "@/components/walkthrough/bus";
import { formatDay } from "./bits";
import { useContracts } from "./data";
import { REVIEW_DOC } from "./fixtures";
import { RISK_LABEL, RISK_TYPES, type RiskType } from "./types";

const doc = REVIEW_DOC;

export function ContractReview() {
  const { state, flagClause, removeFlag, escalate } = useContracts();
  const { toast } = useToast();
  const review = state.reviews[doc.id] ?? { flags: {} };
  const flags = Object.values(review.flags);
  const [editing, setEditing] = useState<string | null>(null);
  const [risk, setRisk] = useState<RiskType | "">("");
  const [suggestion, setSuggestion] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const open = (clauseId: string) => {
    const existing = review.flags[clauseId];
    setEditing(clauseId);
    setRisk(existing?.risk ?? "");
    setSuggestion(existing?.suggestion ?? "");
    setFormError(null);
    emitTour("review.flag_opened", { clauseId });
  };

  const save = async () => {
    if (!editing) return;
    const reason = !risk ? "Choose the type of risk." : suggestion.trim().length < 10 ? "Write a suggested edit Legal can work from (at least 10 characters)." : null;
    if (reason) {
      setFormError(reason);
      emitTour("review.flag_blocked", { clauseId: editing, reason });
      return;
    }
    try {
      await flagClause(doc.id, { clauseId: editing, risk: risk as RiskType, suggestion: suggestion.trim(), at: new Date().toISOString() });
    } catch {
      return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
    }
    emitTour("review.flag_saved", { clauseId: editing, risk });
    setEditing(null);
  };

  const onEscalate = async () => {
    if (flags.length === 0) {
      emitTour("review.escalate_blocked", { docId: doc.id, reason: "No clauses flagged yet." });
      toast({ title: "Nothing to escalate yet", description: "Flag at least one clause with a suggested edit first.", tone: "warn" });
      return;
    }
    try {
      await escalate(doc.id);
    } catch {
      return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
    }
    emitTour("review.escalated", { docId: doc.id, flagCount: flags.length });
    toast({ title: "Escalated to Legal", description: `${flags.length} flagged clause${flags.length === 1 ? "" : "s"} sent to the Legal queue. Expect a reply within one working day.`, tone: "success" });
  };

  return (
    <section aria-labelledby="review-heading" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <GlassCard padding="lg" data-tour="review-doc" className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warn">Client paper</Badge>
          <Badge>{doc.type}</Badge>
          <span className="text-xs text-muted">Received {formatDay(doc.receivedAt)}</span>
        </div>
        <h2 id="review-heading" className="mt-2 text-xl font-semibold">
          {doc.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{doc.brief}</p>

        <ol className="mt-5 flex flex-col gap-3">
          {doc.clauses.map((cl) => {
            const f = review.flags[cl.id];
            const isEditing = editing === cl.id;
            return (
              <li key={cl.id} data-tour={`review-clause-${cl.id}`} className={cn("rounded-lg border p-3.5 transition", f ? "border-warn bg-warn-soft" : "border-border", isEditing && "border-accent shadow-glow")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{cl.heading}</h3>
                    <p className="mt-1 text-sm leading-relaxed">{cl.text}</p>
                  </div>
                  {!isEditing && (
                    <Button
                      size="sm"
                      variant={f ? "ghost" : "secondary"}
                      data-tour={`review-clause-${cl.id}-flag`}
                      leftIcon={f ? <Pencil size={14} aria-hidden /> : <Flag size={14} aria-hidden />}
                      onClick={() => open(cl.id)}
                      aria-label={f ? `Edit flag on ${cl.heading}` : `Flag ${cl.heading}`}
                    >
                      {f ? "Edit" : "Flag"}
                    </Button>
                  )}
                </div>
                {f && !isEditing && (
                  <div className="mt-2.5 flex flex-wrap items-start gap-2 text-sm">
                    <Badge tone="warn">
                      <Flag size={12} aria-hidden /> {RISK_LABEL[f.risk]}
                    </Badge>
                    <p className="min-w-0 flex-1 text-muted">
                      <span className="font-medium text-text">Suggested edit:</span> {f.suggestion}
                    </p>
                  </div>
                )}
                {isEditing && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
                    <Select
                      label="Risk type"
                      data-tour="review-risk-type"
                      value={risk}
                      onChange={(e) => {
                        const v = e.target.value as RiskType;
                        setRisk(v);
                        emitTour("review.risk_selected", { clauseId: cl.id, risk: v });
                      }}
                    >
                      <option value="">Choose a risk type</option>
                      {RISK_TYPES.map((r) => (
                        <option key={r} value={r}>
                          {RISK_LABEL[r]}
                        </option>
                      ))}
                    </Select>
                    <Textarea
                      label="Suggested edit"
                      data-tour="review-suggested-edit"
                      rows={3}
                      placeholder="Rewrite the clause the way Beryll could accept it."
                      value={suggestion}
                      error={formError ?? undefined}
                      onChange={(e) => {
                        setSuggestion(e.target.value);
                        emitTour("review.edit_typed", { clauseId: cl.id, value: e.target.value });
                      }}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      {f && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 size={14} aria-hidden />}
                          onClick={async () => {
                            try {
                              await removeFlag(doc.id, cl.id);
                            } catch {
                              return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
                            }
                            emitTour("review.flag_removed", { clauseId: cl.id });
                            setEditing(null);
                          }}
                        >
                          Remove flag
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" data-tour="review-flag-cancel" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" data-tour="review-flag-save" onClick={save}>
                        Save flag
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </GlassCard>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <GlassCard data-tour="review-flags-summary">
          <h3 className="text-sm font-semibold">Flagged clauses</h3>
          {flags.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Nothing flagged yet. Read each clause and ask: what could this cost Beryll?</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {flags.map((f) => (
                <li key={f.clauseId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{doc.clauses.find((c) => c.id === f.clauseId)?.heading}</span>
                  <Badge tone="warn">{RISK_LABEL[f.risk]}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Button data-tour="review-escalate" className="mt-4 w-full" leftIcon={<Gavel size={16} aria-hidden />} onClick={onEscalate}>
            {review.escalatedAt ? "Update Legal" : "Escalate to Legal"}
          </Button>
        </GlassCard>
        <GlassCard data-tour="review-escalation-status" aria-live="polite">
          <h3 className="text-sm font-semibold">Legal status</h3>
          {review.escalatedAt ? (
            <p className="mt-1 flex items-start gap-2 text-sm">
              <CircleCheck size={18} aria-hidden className="mt-0.5 shrink-0 text-success" />
              <span>
                With Legal since {formatDay(review.escalatedAt)}. Don&apos;t agree any of these terms with the client until Legal replies.
              </span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Not escalated. Beryll never signs client paper without a Legal review.</p>
          )}
        </GlassCard>
      </aside>
    </section>
  );
}
