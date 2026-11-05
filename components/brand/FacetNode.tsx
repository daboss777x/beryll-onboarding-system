"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { cn } from "@/components/ui/cn";

export type FacetState = "locked" | "available" | "active" | "done";

export interface FacetNodeProps {
  state: FacetState;
  size?: number;
  /** Shown in the middle when not locked/done (number, icon...) */
  children?: ReactNode;
  /** Accessible name, e.g. "Stage 2: Learn the contracts tool" */
  label: string;
  onClick?: () => void;
  className?: string;
}

const HEX = "M24 2 L43 13 L43 35 L24 46 L5 35 L5 13 Z";

/** Gem-shaped (faceted hexagon) roadmap node. */
export function FacetNode({ state, size = 56, children, label, onClick, className }: FacetNodeProps) {
  const interactive = !!onClick && state !== "locked";
  const fill =
    state === "done" ? "var(--accent)" : state === "active" ? "var(--aqua)" : state === "available" ? "var(--surface-strong)" : "var(--grey-200)";
  const stroke = state === "locked" ? "var(--border-strong)" : "var(--accent)";
  const inner = (
    <>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="absolute inset-0">
        <path d={HEX} fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" opacity={state === "locked" ? 0.7 : 1} />
        {state !== "locked" && (
          <>
            <path d="M24 2 L43 13 L24 24 L5 13 Z" fill="white" opacity={state === "available" ? 0.35 : 0.28} />
            <path d="M24 24 L43 35 L24 46 Z" fill="black" opacity="0.08" />
          </>
        )}
      </svg>
      <span
        className={cn(
          "relative z-10 flex items-center justify-center font-display text-sm font-semibold",
          state === "done" ? "text-on-accent" : state === "active" ? "text-grey-900" : state === "locked" ? "text-grey-500" : "text-accent",
        )}
      >
        {state === "done" ? <Check size={size * 0.4} strokeWidth={3} /> : state === "locked" ? <Lock size={size * 0.32} /> : children}
      </span>
    </>
  );
  const common = cn(
    "relative inline-flex items-center justify-center rounded-none",
    state === "active" && "drop-shadow-[0_0_14px_rgba(45,212,212,0.55)]",
    className,
  );
  const style = { width: size, height: size };
  if (interactive) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-current={state === "active" ? "step" : undefined}
        style={style}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className={cn(common, "cursor-pointer min-h-10 min-w-10")}
      >
        {inner}
      </motion.button>
    );
  }
  return (
    <span role="img" aria-label={`${label} (${state})`} style={style} className={common}>
      {inner}
    </span>
  );
}
