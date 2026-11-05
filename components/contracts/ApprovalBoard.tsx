"use client";

import { useEffect, useRef, useState } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent } from "@dnd-kit/core";
import { ChevronDown, GripVertical, Paperclip, TriangleAlert } from "lucide-react";
import { Badge, cn, useToast } from "@/components/ui";
import { emitTour, onTourCommand } from "@/components/walkthrough/bus";
import { formatEur } from "./bits";
import { useContracts, type MoveResult } from "./data";
import { hasAuthorisation, needsAuthorisation, nonStandardCount } from "./rules";
import { CONTRACT_STATUSES, STATUS_LABEL, type AppContract, type ContractStatus } from "./types";

const COLUMN_HINT: Record<ContractStatus, string> = {
  draft: "Being written",
  legal_review: "Legal checks wording",
  engineer_signoff: "Engineer confirms scope",
  sent: "Waiting on the client",
  signed: "Ready to schedule",
};

// Prefer the column under the pointer; fall back to overlap for keyboard drags.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

export function ApprovalBoard() {
  const { state, moveContract, attachAuthorisation } = useContracts();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const attempt = async (id: string, to: ContractStatus) => {
    let res: MoveResult;
    try {
      res = await moveContract(id, to);
    } catch {
      return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
    }
    if (res.ok) {
      emitTour("contract.moved", { contractId: id, from: res.from ?? "", to });
      toast({ title: `Moved to ${STATUS_LABEL[to]}`, tone: "success", duration: 2500 });
    } else {
      emitTour("contract.move_blocked", { contractId: id, from: res.from ?? "", to, reason: res.reason });
      toast({ title: res.title, description: res.reason, tone: "warn", duration: 6000 });
    }
  };
  const attemptRef = useRef(attempt);
  useEffect(() => {
    attemptRef.current = attempt;
  });

  const attach = async (c: AppContract) => {
    try {
      await attachAuthorisation(c.id);
    } catch {
      return toast({ title: "Couldn't save that", description: "Your change wasn't saved. Try again in a moment.", tone: "danger" });
    }
    emitTour("contract.authorisation_attached", { contractId: c.id });
    toast({ title: "Authorisation to Test attached", description: `${c.client}'s signed form is now on file.`, tone: "success" });
  };

  useEffect(
    () =>
      onTourCommand((cmd) => {
        if (!cmd.source.startsWith("board-card-") || !cmd.target.startsWith("board-col-")) return false;
        const to = cmd.target.slice("board-col-".length) as ContractStatus;
        if (!CONTRACT_STATUSES.includes(to)) return false;
        void attemptRef.current(cmd.source.slice("board-card-".length), to);
        return true;
      }),
    [],
  );

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const to = e.over?.id as ContractStatus | undefined;
    const c = state.contracts.find((x) => x.id === e.active.id);
    if (!to || !c || c.status === to) return;
    void attempt(c.id, to);
  };

  const active = state.contracts.find((c) => c.id === activeId);

  return (
    <section aria-labelledby="board-heading" data-tour="approval-board" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="board-heading" className="text-xl font-semibold">
          Approval board
        </h2>
        <p className="text-sm text-muted">Drag a card to the next stage, or use “Move to…” on the card.</p>
      </div>
      <DndContext id="approval-board" sensors={sensors} collisionDetection={collision} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-[64rem] grid-cols-5 gap-3">
            {CONTRACT_STATUSES.map((s) => {
              const cards = state.contracts.filter((c) => c.status === s);
              return (
                <Column key={s} status={s} count={cards.length}>
                  {cards.map((c) => (
                    <Card key={c.id} c={c} onMove={(to) => void attempt(c.id, to)} onAttach={() => void attach(c)} />
                  ))}
                </Column>
              );
            })}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>{active && <CardBody c={active} lifted />}</DragOverlay>
      </DndContext>
    </section>
  );
}

function Column({ status, count, children }: { status: ContractStatus; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      data-tour={`board-col-${status}`}
      role="group"
      aria-label={`${STATUS_LABEL[status]} column, ${count} contract${count === 1 ? "" : "s"}`}
      className={cn("glass flex min-h-80 flex-col gap-2 rounded-xl p-2.5 transition", isOver && "border-accent shadow-glow")}
    >
      <div className="flex items-center justify-between px-1 pb-1">
        <div>
          <h3 className="text-sm font-semibold">{STATUS_LABEL[status]}</h3>
          <p className="text-xs text-muted">{COLUMN_HINT[status]}</p>
        </div>
        <Badge>{count}</Badge>
      </div>
      {children}
    </div>
  );
}

function Card({ c, onMove, onAttach }: { c: AppContract; onMove: (to: ContractStatus) => void; onAttach: () => void }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: c.id, disabled: c.status === "signed" });
  const needsAuth = needsAuthorisation(c) && !hasAuthorisation(c) && c.status !== "signed";
  return (
    <article data-tour={`board-card-${c.id}`} className={cn("rounded-lg", isDragging && "opacity-40")}>
      <div ref={setNodeRef} {...attributes} {...listeners} aria-label={`${c.title}, ${c.client}. Drag to move, or use the Move to menu.`} className={cn("touch-none", c.status !== "signed" && "cursor-grab active:cursor-grabbing")}>
        <CardBody c={c} />
      </div>
      <div className="-mt-1 flex flex-wrap items-center gap-1.5 rounded-b-lg border border-t-0 border-border bg-surface-strong px-2.5 pb-2.5 pt-2">
        {c.status !== "signed" && (
          <label className="relative inline-flex">
            <span className="sr-only">Move {c.title} to</span>
            <select
              data-tour={`board-card-${c.id}-move`}
              value=""
              onChange={(e) => e.target.value && onMove(e.target.value as ContractStatus)}
              className="min-h-10 cursor-pointer appearance-none rounded-md border border-border-strong bg-surface-strong pl-2.5 pr-7 text-xs font-medium text-text"
            >
              <option value="">Move to…</option>
              {CONTRACT_STATUSES.filter((s) => s !== c.status).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
          </label>
        )}
        {needsAuth && (
          <button
            type="button"
            data-tour={`board-card-${c.id}-attach`}
            onClick={onAttach}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-accent hover:bg-accent-soft"
          >
            <Paperclip size={14} aria-hidden /> Attach authorisation
          </button>
        )}
      </div>
    </article>
  );
}

function CardBody({ c, lifted }: { c: AppContract; lifted?: boolean }) {
  const ns = nonStandardCount(c);
  return (
    <div className={cn("rounded-t-lg border border-border bg-surface-strong p-2.5", lifted && "rotate-2 rounded-lg shadow-glow")}>
      <div className="flex items-start gap-1.5">
        <GripVertical size={14} aria-hidden className="mt-0.5 shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{c.title}</p>
          <p className="truncate text-xs text-muted">{c.client}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge>{c.type}</Badge>
        {c.valueEur > 0 && <span className="text-xs text-muted">{formatEur(c.valueEur)}</span>}
        {ns > 0 && c.status !== "signed" && (
          <Badge tone="warn">
            <TriangleAlert size={12} aria-hidden /> {ns} non-standard
          </Badge>
        )}
        {needsAuthorisation(c) && hasAuthorisation(c) && (
          <Badge tone="success">
            <Paperclip size={12} aria-hidden /> Auth
          </Badge>
        )}
      </div>
    </div>
  );
}
