"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Check, FileSignature, Save } from "lucide-react";
import { Badge, Button, GlassCard, Input, Stepper, Textarea, cn, useToast } from "@/components/ui";
import { emitTour } from "@/components/walkthrough/bus";
import { formatEur } from "./bits";
import { ClauseBuilder } from "./ClauseBuilder";
import { useContracts } from "./data";
import { CLIENTS, TEMPLATES } from "./fixtures";
import { nonStandardCount } from "./rules";
import type { AppContract, Clause, ContractTemplate, SowScope, TemplateId } from "./types";

const STEPS = [
  { label: "Client", description: "Who it's for" },
  { label: "Template", description: "Pick a starting point" },
  { label: "Details", description: "Scope, dates, price" },
  { label: "Clauses", description: "Build the document" },
];

interface Draft {
  clientId?: string;
  templateId?: TemplateId;
  title: string;
  scope: SowScope;
  startDate: string;
  endDate: string;
  price: string;
  clauses: Clause[];
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
/**
 * Monday to Friday of the week after next. Only called from an event handler (never during render),
 * and done in UTC throughout so the weekday maths and the ISO date can't disagree near midnight.
 */
function nextMondayWeek(now: Date = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + 7);
  const end = new Date(d);
  end.setUTCDate(d.getUTCDate() + 4);
  return { startDate: isoDay(d), endDate: isoDay(end) };
}

export function NewContractFlow({ onCancel, onSaved }: { onCancel: () => void; onSaved: (c: AppContract) => void }) {
  const { createContract } = useContracts();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [d, setD] = useState<Draft>({ title: "", scope: { targets: "", window: "", exclusions: "" }, startDate: "", endDate: "", price: "", clauses: [] });

  const client = CLIENTS.find((c) => c.id === d.clientId);
  const template = TEMPLATES.find((t) => t.id === d.templateId);
  const isSow = template?.type === "SOW";

  const pickClient = (id: string) => {
    setD((s) => ({ ...s, clientId: id }));
    emitTour("contract.client_selected", { clientId: id });
    setStep(1);
  };
  const pickTemplate = (t: ContractTemplate) => {
    setD((s) => ({
      ...s,
      templateId: t.id,
      title: `${t.name}: ${client?.name ?? "client"}`,
      clauses: t.clauses,
      scope: { ...s.scope, window: s.scope.window || (t.type === "SOW" ? "Weekdays 09:00 to 17:30 Irish time" : "") },
      ...(s.startDate ? {} : nextMondayWeek()),
    }));
    emitTour("contract.template_selected", { template: t.id });
    setStep(2);
  };

  const setScope = (k: keyof SowScope, v: string) => {
    setD((s) => ({ ...s, scope: { ...s.scope, [k]: v } }));
    emitTour(`contract.scope.${k}`, { value: v });
  };

  const continueDetails = () => {
    const e: Record<string, string> = {};
    if (!d.title.trim()) e.title = "Give the contract a title.";
    if (isSow && !d.scope.targets.trim()) e.targets = "List at least one target, IP range or application. Untested scope can't be invoiced.";
    if (!d.startDate) e.startDate = "Pick a start date.";
    if (d.endDate && d.startDate && d.endDate < d.startDate) e.endDate = "The end date must be on or after the start date.";
    const price = Number(d.price);
    if (isSow && !(price > 0)) e.price = "Enter the fixed price in euro (numbers only).";
    else if (d.price && !(price >= 0)) e.price = "Price must be a number.";
    setErrors(e);
    if (Object.keys(e).length) {
      emitTour("contract.scope_blocked", { reason: Object.values(e)[0] });
      return;
    }
    emitTour("contract.scope_completed", {});
    setStep(3);
  };

  const save = async () => {
    if (!client || !template) return;
    const now = new Date().toISOString();
    const contract: AppContract = {
      id: `ct-${Date.now().toString(36)}`,
      clientId: client.id,
      client: client.name,
      type: template.type,
      title: d.title.trim(),
      valueEur: Math.round(Number(d.price) || 0),
      status: "draft",
      owner: "You",
      updatedAt: now,
      clauses: d.clauses,
      scope: isSow ? d.scope : undefined,
      startDate: d.startDate || undefined,
      endDate: d.endDate || undefined,
      attachments: [],
      history: [],
    };
    try {
      await createContract(contract);
    } catch {
      return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
    }
    const ns = nonStandardCount(contract);
    emitTour("contract.saved", { contractId: contract.id, clauseCount: contract.clauses.length, nonStandard: ns });
    toast({
      title: "Draft saved",
      description: ns > 0 ? `${ns} non-standard clause${ns === 1 ? "" : "s"}: this will need Legal Review.` : "All standard wording, so it can go straight to Engineer Sign-off.",
      tone: "success",
    });
    onSaved(contract);
  };

  return (
    <section aria-labelledby="new-contract-heading" data-tour="new-flow" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="new-contract-heading" className="text-xl font-semibold">
            New contract
          </h2>
          <p className="text-sm text-muted">{client ? `${client.name}${template ? ` · ${template.name}` : ""}` : "Start by choosing the client."}</p>
        </div>
        <Button variant="ghost" data-tour="new-cancel" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <GlassCard padding="md">
        <Stepper steps={STEPS} current={step} />
      </GlassCard>

      {step === 0 && (
        <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <legend className="sr-only">Choose a client</legend>
          {CLIENTS.map((c) => (
            <OptionCard key={c.id} tour={`new-client-${c.id}`} selected={d.clientId === c.id} onClick={() => pickClient(c.id)} icon={<Building2 size={20} aria-hidden />} title={c.name} sub={`${c.sector} · ${c.contactName}`} />
          ))}
        </fieldset>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <fieldset className="grid gap-3 md:grid-cols-3">
            <legend className="sr-only">Choose a template</legend>
            {TEMPLATES.map((t) => (
              <OptionCard key={t.id} tour={`new-template-${t.id}`} selected={d.templateId === t.id} onClick={() => pickTemplate(t)} icon={<FileSignature size={20} aria-hidden />} title={t.name} sub={t.description} badge={`${t.clauses.length} clauses`} />
            ))}
          </fieldset>
          <div>
            <Button variant="secondary" data-tour="new-back" leftIcon={<ArrowLeft size={16} aria-hidden />} onClick={() => setStep(0)}>
              Change client
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <GlassCard padding="lg" className="flex flex-col gap-4">
          <Input label="Contract title" data-tour="new-title" value={d.title} error={errors.title} onChange={(e) => setD((s) => ({ ...s, title: e.target.value }))} />
          {isSow && (
            <>
              <Textarea
                label="Targets and IP ranges"
                data-tour="new-scope-targets"
                rows={3}
                placeholder="e.g. 10.20.0.0/24, portal.example.ie, iOS app v4.2"
                hint="Be exact. We only test what's written here."
                error={errors.targets}
                value={d.scope.targets}
                onChange={(e) => setScope("targets", e.target.value)}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Testing window" data-tour="new-scope-window" value={d.scope.window} hint="When testers may be active." onChange={(e) => setScope("window", e.target.value)} />
                <Input
                  label="Exclusions"
                  data-tour="new-scope-exclusions"
                  value={d.scope.exclusions}
                  placeholder="Systems we must not touch"
                  hint="Fragile or third-party systems."
                  onChange={(e) => setScope("exclusions", e.target.value)}
                />
              </div>
            </>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="date"
              label="Start date"
              data-tour="new-start-date"
              value={d.startDate}
              error={errors.startDate}
              onChange={(e) => {
                setD((s) => ({ ...s, startDate: e.target.value }));
                emitTour("contract.dates", { start: e.target.value, end: d.endDate });
              }}
            />
            <Input
              type="date"
              label="End date"
              data-tour="new-end-date"
              value={d.endDate}
              error={errors.endDate}
              onChange={(e) => {
                setD((s) => ({ ...s, endDate: e.target.value }));
                emitTour("contract.dates", { start: d.startDate, end: e.target.value });
              }}
            />
            <Input
              label="Price (EUR, excl. VAT)"
              data-tour="new-price"
              inputMode="numeric"
              placeholder="e.g. 18500"
              value={d.price}
              error={errors.price}
              hint={Number(d.price) > 0 ? formatEur(Number(d.price)) : undefined}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, "");
                setD((s) => ({ ...s, price: v }));
                emitTour("contract.price", { value: v });
              }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 pt-1">
            <Button variant="secondary" data-tour="new-back" leftIcon={<ArrowLeft size={16} aria-hidden />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button data-tour="new-scope-continue" onClick={continueDetails}>
              Continue to clauses
            </Button>
          </div>
        </GlassCard>
      )}

      {step === 3 && template && (
        <GlassCard padding="lg" className="flex flex-col gap-4">
          <ClauseBuilder type={template.type} clauses={d.clauses} onChange={(clauses) => setD((s) => ({ ...s, clauses }))} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button variant="secondary" data-tour="new-back" leftIcon={<ArrowLeft size={16} aria-hidden />} onClick={() => setStep(2)}>
              Back
            </Button>
            <div className="flex items-center gap-3">
              {nonStandardCount(d) > 0 && <Badge tone="warn">Needs Legal: {nonStandardCount(d)} non-standard</Badge>}
              <Button data-tour="new-save-draft" leftIcon={<Save size={16} aria-hidden />} onClick={save}>
                Save draft
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </section>
  );
}

function OptionCard({ tour, selected, onClick, icon, title, sub, badge }: { tour: string; selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string; badge?: string }) {
  return (
    <button
      type="button"
      data-tour={tour}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "glass flex min-h-24 cursor-pointer items-start gap-3 rounded-xl p-4 text-left transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-glow",
        selected && "border-accent shadow-glow",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{selected ? <Check size={20} aria-hidden /> : icon}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {title}
          {badge && <Badge>{badge}</Badge>}
        </span>
        <span className="mt-1 block text-sm text-muted">{sub}</span>
      </span>
    </button>
  );
}
