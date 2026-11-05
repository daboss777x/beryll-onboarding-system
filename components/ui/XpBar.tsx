"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "./cn";

export interface XpBarProps {
  xp: number;
  /** XP needed to reach the next rank/level */
  nextAt: number;
  levelLabel?: string;
  nextLabel?: string;
  className?: string;
}

export function XpBar({ xp, nextAt, levelLabel, nextLabel, className }: XpBarProps) {
  const pct = nextAt > 0 ? Math.min(100, Math.max(0, (xp / nextAt) * 100)) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Sparkles size={14} aria-hidden className="text-accent" />
          {levelLabel ?? "XP"}
        </span>
        <span className="tabular-nums text-muted">
          {xp} / {nextAt} XP{nextLabel ? ` to ${nextLabel}` : ""}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Experience points"
        aria-valuemin={0}
        aria-valuemax={nextAt}
        aria-valuenow={Math.min(xp, nextAt)}
        className="h-3 overflow-hidden rounded-full bg-grey-200 [[data-theme=dark]_&]:bg-white/10"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-aqua via-accent to-aqua-deep shadow-[0_0_12px_rgba(45,212,212,0.5)]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
