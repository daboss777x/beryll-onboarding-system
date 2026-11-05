"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Input, Textarea, cn } from "@/components/ui";
import { emitTour, onTourCommand } from "@/components/walkthrough/bus";
import { CLAUSE_LIBRARY } from "./fixtures";
import type { Clause, ContractType, LibraryClause } from "./types";

const strip = ({ id, title, text, standard }: Clause): Clause => ({ id, title, text, standard });

export function ClauseBuilder({ type, clauses, onChange }: { type: ContractType; clauses: Clause[]; onChange: (next: Clause[]) => void }) {
  const library = CLAUSE_LIBRARY.filter((c) => c.appliesTo.includes(type));
  const available = library.filter((l) => !clauses.some((c) => c.id === l.id));
  const libIds = new Set(library.map((l) => l.id));
  const [dragging, setDragging] = useState<Clause | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const latest = useRef({ clauses, onChange });
  useEffect(() => {
    latest.current = { clauses, onChange };
  });

  const add = (lib: LibraryClause, index?: number) => {
    const { clauses: cur, onChange: set } = latest.current;
    if (cur.some((c) => c.id === lib.id)) return;
    const next = [...cur];
    next.splice(index ?? next.length, 0, strip(lib));
    set(next);
    emitTour("contract.clause_added", { clauseId: lib.id, standard: lib.standard });
  };
  const addCustom = (cl: Clause) => {
    onChange([...clauses, cl]);
    emitTour("contract.clause_added", { clauseId: cl.id, standard: false });
  };
  const remove = (id: string) => {
    onChange(clauses.filter((c) => c.id !== id));
    emitTour("contract.clause_removed", { clauseId: id });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= clauses.length) return;
    onChange(arrayMove(clauses, from, to));
    emitTour("contract.clause_reordered", { clauseId: clauses[from].id, index: to });
  };

  // Watch mode: the ghost cursor asks us to perform library drags.
  useEffect(
    () =>
      onTourCommand((cmd) => {
        if (!cmd.source.startsWith("clause-lib-") || cmd.target !== "clause-doc-dropzone") return false;
        const lib = CLAUSE_LIBRARY.find((l) => `clause-lib-${l.id}` === cmd.source);
        if (!lib) return false;
        add(lib);
        return true;
      }),
    [],
  );

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const key = id.slice(4);
    setDragging(id.startsWith("lib:") ? (library.find((l) => l.id === key) ?? null) : (clauses.find((c) => c.id === key) ?? null));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const active = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over) return;
    const overIndex = over.startsWith("doc:") ? clauses.findIndex((c) => `doc:${c.id}` === over) : -1;
    if (active.startsWith("lib:")) {
      const lib = library.find((l) => `lib:${l.id}` === active);
      if (lib && (over === "doc-dropzone" || overIndex >= 0)) add(lib, overIndex >= 0 ? overIndex : undefined);
      return;
    }
    const from = clauses.findIndex((c) => `doc:${c.id}` === active);
    if (from >= 0 && overIndex >= 0 && from !== overIndex) move(from, overIndex);
  };

  return (
    <DndContext id="clause-builder" sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div data-tour="clause-library" className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Clause library</h3>
          <p className="text-xs text-muted">Drag a clause into the document, or press Add.</p>
          {available.length === 0 && <p className="rounded-lg border border-dashed border-border-strong p-3 text-xs text-muted">Every optional clause is already in the document.</p>}
          <ul className="flex flex-col gap-2">
            {available.map((l) => (
              <LibraryItem key={l.id} clause={l} onAdd={() => add(l)} />
            ))}
          </ul>
          <CustomClauseForm onAdd={(cl) => addCustom(cl)} />
        </div>

        <DocDropzone empty={clauses.length === 0} active={!!dragging && libIds.has(dragging.id) && !clauses.some((c) => c.id === dragging.id)}>
          <SortableContext id="clause-doc" items={clauses.map((c) => `doc:${c.id}`)} strategy={verticalListSortingStrategy}>
            <ol data-tour="clause-doc-list" className="flex flex-col gap-2">
              {clauses.map((c, i) => (
                <DocClause key={c.id} clause={c} index={i} count={clauses.length} removable={libIds.has(c.id) || !c.standard} onMove={move} onRemove={remove} />
              ))}
            </ol>
          </SortableContext>
        </DocDropzone>
      </div>
      <DragOverlay dropAnimation={null}>{dragging && <ClauseChip clause={dragging} lifted />}</DragOverlay>
    </DndContext>
  );
}

function ClauseChip({ clause, lifted }: { clause: Clause; lifted?: boolean }) {
  return (
    <div className={cn("glass-strong flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm", lifted && "rotate-1 shadow-glow")}>
      <GripVertical size={16} aria-hidden className="text-muted" />
      <span className="font-medium">{clause.title}</span>
      {!clause.standard && <Badge tone="warn">Non-standard</Badge>}
    </div>
  );
}

function LibraryItem({ clause, onAdd }: { clause: LibraryClause; onAdd: () => void }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: `lib:${clause.id}` });
  return (
    <li className={cn("glass rounded-lg transition", isDragging && "opacity-40")}>
      <div className="flex items-start gap-2 p-2.5">
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          data-tour={`clause-lib-${clause.id}`}
          aria-label={`Drag ${clause.title} into the document`}
          className="flex min-w-0 flex-1 cursor-grab touch-none items-start gap-2 rounded-md active:cursor-grabbing"
        >
          <GripVertical size={16} aria-hidden className="mt-0.5 shrink-0 text-muted" />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
              {clause.title}
              {!clause.standard && <Badge tone="warn">Non-standard</Badge>}
            </span>
            <span className="mt-0.5 block text-xs text-muted">{clause.guidance}</span>
          </span>
        </div>
        <button
          type="button"
          data-tour={`clause-lib-${clause.id}-add`}
          onClick={onAdd}
          aria-label={`Add ${clause.title}`}
          className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-accent hover:bg-accent-soft"
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </li>
  );
}

function DocDropzone({ children, empty, active }: { children: React.ReactNode; empty: boolean; active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "doc-dropzone" });
  return (
    <div
      ref={setNodeRef}
      data-tour="clause-doc-dropzone"
      className={cn(
        "flex min-h-64 flex-col gap-2 rounded-xl border-2 border-dashed p-3 transition",
        active ? "border-accent bg-accent-soft/50" : "border-border-strong",
        isOver && "shadow-glow",
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Document</h3>
        <span className="text-xs text-muted">Drag the handle to reorder</span>
      </div>
      {empty && <p className="text-sm text-muted">Drop clauses here.</p>}
      {children}
    </div>
  );
}

function DocClause({ clause, index, count, removable, onMove, onRemove }: { clause: Clause; index: number; count: number; removable: boolean; onMove: (from: number, to: number) => void; onRemove: (id: string) => void }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: `doc:${clause.id}` });
  return (
    <li
      ref={setNodeRef}
      data-tour={`clause-doc-${clause.id}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-border bg-surface-strong", isDragging && "relative z-10 opacity-60 shadow-glow")}
    >
      <div className="flex items-start gap-1.5 p-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${clause.title}. Press space to lift, arrows to move.`}
          className="inline-flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted hover:bg-accent-soft active:cursor-grabbing"
        >
          <GripVertical size={16} aria-hidden />
        </button>
        <div className="min-w-0 flex-1 py-1.5">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            <span className="text-muted">{index + 1}.</span> {clause.title}
            {!clause.standard && <Badge tone="warn">Non-standard</Badge>}
            {removable && clause.standard && <Badge tone="aqua">Optional</Badge>}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{clause.text}</p>
        </div>
        <div className="flex shrink-0">
          <IconBtn label={`Move ${clause.title} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
            <ArrowUp size={16} aria-hidden />
          </IconBtn>
          <IconBtn label={`Move ${clause.title} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
            <ArrowDown size={16} aria-hidden />
          </IconBtn>
          {removable && (
            <IconBtn label={`Remove ${clause.title}`} onClick={() => onRemove(clause.id)} tour={`clause-doc-${clause.id}-remove`}>
              <Trash2 size={16} aria-hidden />
            </IconBtn>
          )}
        </div>
      </div>
    </li>
  );
}

function IconBtn({ label, onClick, disabled, children, tour }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode; tour?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      data-tour={tour}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-accent-soft hover:text-text disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function CustomClauseForm({ onAdd }: { onAdd: (c: Clause) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  if (!open)
    return (
      <Button variant="secondary" size="sm" data-tour="clause-custom-open" leftIcon={<Plus size={14} aria-hidden />} onClick={() => setOpen(true)}>
        Write a custom clause
      </Button>
    );
  return (
    <div className="glass flex flex-col gap-2.5 rounded-lg p-3">
      <p className="text-xs text-warn">Custom wording is non-standard: the contract will need Legal Review.</p>
      <Input label="Clause title" data-tour="clause-custom-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea label="Clause wording" data-tour="clause-custom-text" rows={3} value={text} error={error} onChange={(e) => setText(e.target.value)} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          data-tour="clause-custom-add"
          onClick={() => {
            if (!title.trim() || text.trim().length < 20) return setError("Give it a title and at least 20 characters of wording.");
            onAdd({ id: `custom-${Date.now().toString(36)}`, title: title.trim(), text: text.trim(), standard: false });
            setTitle("");
            setText("");
            setError(undefined);
            setOpen(false);
          }}
        >
          Add to document
        </Button>
      </div>
    </div>
  );
}
