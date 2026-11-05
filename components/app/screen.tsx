import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Hammer, Info, Lightbulb, Lock, ShieldAlert, Sparkles } from "lucide-react";
import { Badge, EmptyState, GlassCard, Skeleton, buttonStyles, cn, type BadgeTone } from "@/components/ui";
import type { TaskDef, TaskStatus } from "@/lib/types";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold text-balance sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, description, children, id, action }: { title: string; description?: string; children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-20">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const STATUS: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  locked: { label: "Locked", tone: "neutral" },
  available: { label: "Ready", tone: "aqua" },
  in_progress: { label: "In progress", tone: "warn" },
  done: { label: "Done", tone: "success" },
  failed: { label: "Try again", tone: "danger" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

/** One task as a row. Locked tasks are not links. */
export function TaskRow({ task, status, programDay, compact }: { task: TaskDef; status: TaskStatus; programDay: number; compact?: boolean }) {
  const locked = status === "locked";
  const unlockNote = locked && (task.unlockDay ?? 0) > programDay ? `Opens day ${task.unlockDay}` : locked ? "Finish earlier steps first" : null;
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium", locked && "text-muted")}>{task.title}</span>
          {!task.required && <span className="text-xs text-muted">Optional</span>}
        </div>
        {!compact && <p className="mt-0.5 text-sm text-muted">{task.summary}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} aria-hidden /> {task.estMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles size={12} aria-hidden /> {task.xp} XP
          </span>
          {unlockNote && (
            <span className="inline-flex items-center gap-1">
              <Lock size={12} aria-hidden /> {unlockNote}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TaskStatusBadge status={status} />
        {!locked && <ArrowRight size={16} aria-hidden className="hidden text-muted sm:block" />}
      </div>
    </>
  );
  const cls = "flex items-start gap-3 rounded-lg px-3 py-3 sm:items-center";
  if (locked) return <div className={cn(cls, "opacity-80")}>{body}</div>;
  return (
    <Link href={task.href} className={cn(cls, "hover:bg-surface-strong focus-visible:bg-surface-strong")}>
      {body}
    </Link>
  );
}

const CALLOUT = {
  tip: { icon: Lightbulb, label: "Tip", cls: "bg-accent-soft text-text", ic: "text-accent" },
  rule: { icon: ShieldAlert, label: "Rule", cls: "bg-danger-soft text-text", ic: "text-danger" },
  warning: { icon: AlertTriangle, label: "Watch out", cls: "bg-warn-soft text-text", ic: "text-warn" },
  example: { icon: Info, label: "Example", cls: "bg-surface-strong text-text", ic: "text-muted" },
} as const;

export function Callout({ tone, children }: { tone: keyof typeof CALLOUT; children: ReactNode }) {
  const c = CALLOUT[tone];
  const Icon = c.icon;
  return (
    <aside className={cn("my-4 flex gap-3 rounded-lg p-4 text-sm", c.cls)}>
      <Icon size={18} aria-hidden className={cn("mt-0.5 shrink-0", c.ic)} />
      <div>
        <p className="mb-0.5 text-xs font-semibold tracking-wide uppercase">{c.label}</p>
        {children}
      </div>
    </aside>
  );
}

export function ComingSoon({ title, description, backHref = "/today", backLabel = "Back to Today" }: { title: string; description: string; backHref?: string; backLabel?: string }) {
  return (
    <div className="mx-auto max-w-xl py-6">
      <EmptyState
        icon={<Hammer size={26} aria-hidden />}
        title={title}
        description={description}
        action={
          <Link href={backHref} className={buttonStyles({ variant: "secondary" })}>
            {backLabel}
          </Link>
        }
      />
    </div>
  );
}

export function NotFoundPanel({ title, description, href = "/today", label = "Back to Today" }: { title: string; description: string; href?: string; label?: string }) {
  return (
    <div className="mx-auto max-w-xl py-6">
      <EmptyState
        title={title}
        description={description}
        action={
          <Link href={href} className={buttonStyles({ variant: "secondary" })}>
            {label}
          </Link>
        }
      />
    </div>
  );
}

/** Generic page skeleton for loading.tsx files. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-2/3 max-w-md" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="mt-2 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <GlassCard key={i} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
