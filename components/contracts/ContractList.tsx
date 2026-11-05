"use client";

import { useMemo, useState } from "react";
import { FileText, Paperclip, Plus, RotateCcw, Search, TriangleAlert } from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, Select, Sheet, useToast } from "@/components/ui";
import { emitTour } from "@/components/walkthrough/bus";
import { StatusBadge, formatDay, formatEur } from "./bits";
import { useContracts } from "./data";
import { hasAuthorisation, nonStandardCount } from "./rules";
import { CONTRACT_STATUSES, CONTRACT_TYPES, STATUS_LABEL, type AppContract } from "./types";

export function ContractList({ onNew, highlightId }: { onNew: () => void; highlightId?: string }) {
  const { state, resetSandbox } = useContracts();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<AppContract | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.contracts
      .filter((c) => (type === "all" || c.type === type) && (status === "all" || c.status === status))
      .filter((c) => !q || `${c.title} ${c.client} ${c.owner} ${c.type}`.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.contracts, query, type, status]);

  const filtered = query || type !== "all" || status !== "all";

  return (
    <section aria-labelledby="contracts-list-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <label htmlFor="contracts-search" className="sr-only">
            Search contracts
          </label>
          <Search aria-hidden size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="contracts-search"
            data-tour="contracts-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              emitTour("contracts.searched", { query: e.target.value });
            }}
            placeholder="Search by client, title or owner"
            className="min-h-11 w-full rounded-md border border-border-strong bg-surface-strong pl-10 pr-3.5 text-sm text-text placeholder:text-muted focus-visible:border-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Select
            aria-label="Filter by type"
            data-tour="contracts-filter-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              emitTour("contracts.filtered", { filter: "type", value: e.target.value });
            }}
            wrapperClassName="sm:w-40"
          >
            <option value="all">All types</option>
            {CONTRACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by status"
            data-tour="contracts-filter-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              emitTour("contracts.filtered", { filter: "status", value: e.target.value });
            }}
            wrapperClassName="sm:w-48"
          >
            <option value="all">All statuses</option>
            {CONTRACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <Button data-tour="contracts-new" leftIcon={<Plus size={18} aria-hidden />} onClick={onNew} className="shrink-0">
          New contract
        </Button>
      </div>

      <GlassCard padding="none" data-tour="contracts-list" className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="contracts-list-heading" className="text-sm font-semibold">
            {rows.length} contract{rows.length === 1 ? "" : "s"}
            {filtered && <span className="font-normal text-muted"> matching your filters</span>}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            data-tour="contracts-reset"
            leftIcon={<RotateCcw size={14} aria-hidden />}
            onClick={async () => {
              try {
                await resetSandbox();
              } catch {
                return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
              }
              toast({ title: "Sandbox reset", description: "Your practice contracts are back to the starting set.", tone: "info" });
            }}
          >
            Reset sandbox
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<FileText size={26} aria-hidden />}
              title="No contracts match"
              description="Try a different search or clear the filters."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setType("all");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <ul role="list" className="divide-y divide-border">
            {rows.map((c) => {
              const ns = nonStandardCount(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    data-tour={`contract-row-${c.id}`}
                    onClick={() => setOpen(c)}
                    className={
                      "grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 text-left transition hover:bg-accent-soft md:grid-cols-[minmax(0,2.4fr)_5rem_9.5rem_6.5rem_7.5rem_6.5rem] " +
                      (c.id === highlightId ? "bg-accent-soft" : "")
                    }
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="block truncate text-xs text-muted">{c.client}</span>
                    </span>
                    <span className="hidden md:block">
                      <Badge>{c.type}</Badge>
                    </span>
                    <span className="flex flex-wrap items-center justify-end gap-1.5 md:justify-start">
                      <StatusBadge status={c.status} />
                      {ns > 0 && c.status === "draft" && (
                        <TriangleAlert size={15} className="text-warn" aria-label={`${ns} non-standard clauses`} />
                      )}
                    </span>
                    <span className="text-xs text-muted md:text-sm md:text-text">
                      <span className="md:hidden">{c.type} · </span>
                      {formatEur(c.valueEur)}
                    </span>
                    <span className="hidden truncate text-sm text-muted md:block">{c.owner}</span>
                    <span className="text-right text-xs text-muted md:text-left md:text-sm">{formatDay(c.updatedAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} description={open ? `${open.client} · ${open.type}` : undefined}>
        {open && <ContractDetail c={open} />}
      </Sheet>
    </section>
  );
}

function ContractDetail({ c }: { c: AppContract }) {
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <StatusBadge status={c.status} />
        </Field>
        <Field label="Value">{formatEur(c.valueEur)}</Field>
        <Field label="Owner">{c.owner}</Field>
        <Field label="Updated">{formatDay(c.updatedAt)}</Field>
        {c.startDate && <Field label="Testing dates">{`${formatDay(c.startDate)} to ${formatDay(c.endDate ?? c.startDate)}`}</Field>}
        {c.type === "SOW" && (
          <Field label="Authorisation">
            {hasAuthorisation(c) ? (
              <Badge tone="success">
                <Paperclip size={12} aria-hidden /> Attached
              </Badge>
            ) : (
              <Badge tone="warn">Missing</Badge>
            )}
          </Field>
        )}
      </dl>
      {c.scope && (
        <div className="rounded-lg border border-border p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Scope</h3>
          <p className="mt-1.5">
            <span className="font-medium">Targets:</span> {c.scope.targets || "—"}
          </p>
          <p className="mt-1">
            <span className="font-medium">Window:</span> {c.scope.window || "—"}
          </p>
          <p className="mt-1">
            <span className="font-medium">Exclusions:</span> {c.scope.exclusions || "None"}
          </p>
        </div>
      )}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Clauses ({c.clauses.length})</h3>
        <ol className="mt-2 flex flex-col gap-2">
          {c.clauses.map((cl, i) => (
            <li key={cl.id} className="rounded-lg border border-border p-3">
              <p className="flex items-center gap-2 font-medium">
                <span className="text-muted">{i + 1}.</span> {cl.title}
                {!cl.standard && <Badge tone="warn">Non-standard</Badge>}
              </p>
              <p className="mt-1 text-muted">{cl.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
