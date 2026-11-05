import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** prism: gradient hero card (use sparingly). strong: more opaque. */
  variant?: "default" | "strong" | "prism";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const pad = { none: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-5 sm:p-7" } as const;

export function GlassCard({ variant = "default", padding = "md", interactive, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl text-text",
        variant === "strong" ? "glass-strong" : "glass",
        variant === "prism" && "bg-prism",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-glow",
        pad[padding],
        className,
      )}
      {...props}
    />
  );
}
