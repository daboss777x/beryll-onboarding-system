import type { ReactNode } from "react";
import { Gem } from "lucide-react";
import { cn } from "./cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("glass flex flex-col items-center rounded-xl px-6 py-10 text-center", className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon ?? <Gem size={26} aria-hidden />}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
