import { Check } from "lucide-react";
import { cn } from "./cn";

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** zero-based index of the current step */
  current: number;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Stepper({ steps, current, orientation = "horizontal", className }: StepperProps) {
  const vertical = orientation === "vertical";
  return (
    <ol className={cn("flex", vertical ? "flex-col gap-0" : "w-full items-start", className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s.label}
            aria-current={active ? "step" : undefined}
            className={cn("relative flex", vertical ? "gap-3 pb-6 last:pb-0" : "min-w-0 flex-1 flex-col items-center gap-2 text-center")}
          >
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute",
                  done ? "bg-accent" : "bg-border-strong",
                  vertical ? "left-[15px] top-8 h-[calc(100%-2rem)] w-0.5" : "left-1/2 top-4 h-0.5 w-full",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-accent bg-accent text-on-accent",
                active && "border-accent bg-bg-elevated text-accent shadow-glow",
                !done && !active && "border-border-strong bg-bg-elevated text-muted",
              )}
            >
              {done ? <Check size={16} strokeWidth={3} aria-hidden /> : i + 1}
              <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
            </span>
            <span className={cn("min-w-0", vertical && "pt-1 text-left")}>
              <span className={cn("block text-xs font-medium sm:text-sm", !done && !active && "text-muted")}>{s.label}</span>
              {s.description && <span className="mt-0.5 hidden text-xs text-muted sm:block">{s.description}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
