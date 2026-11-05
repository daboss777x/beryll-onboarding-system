import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "./cn";

export interface StatProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** e.g. "+12%" ; sign decides colour unless trend is given */
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  className?: string;
}

export function Stat({ label, value, icon, delta, trend, hint, className }: StatProps) {
  const t = trend ?? (delta?.startsWith("-") ? "down" : delta ? "up" : "flat");
  return (
    <GlassCard className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2 text-sm text-muted">
        <span>{label}</span>
        {icon && <span className="text-accent" aria-hidden>{icon}</span>}
      </div>
      <div className="font-display text-3xl font-semibold tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="flex items-center gap-2 text-xs">
          {delta && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", t === "down" ? "text-danger" : t === "up" ? "text-success" : "text-muted")}>
              {t === "down" ? <ArrowDownRight size={14} aria-hidden /> : t === "up" ? <ArrowUpRight size={14} aria-hidden /> : null}
              {delta}
            </span>
          )}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
    </GlassCard>
  );
}
