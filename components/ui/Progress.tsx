"use client";

import { motion } from "framer-motion";
import { cn } from "./cn";

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export interface ProgressBarProps {
  value: number; // 0..100
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({ value, label, showValue, size = "md", className }: ProgressBarProps) {
  const v = clamp(value);
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span>{label}</span>
          {showValue && <span className="tabular-nums">{Math.round(v)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        aria-label={label ?? "Progress"}
        className={cn("overflow-hidden rounded-full bg-grey-200 [[data-theme=dark]_&]:bg-white/10", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-aqua to-accent"
          initial={false}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({ value, size = 72, stroke = 7, label = "Progress", children, className }: ProgressRingProps) {
  const v = clamp(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--grey-200)" strokeWidth={stroke} opacity={0.8} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v / 100) }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums">{children ?? `${Math.round(v)}%`}</span>
    </div>
  );
}
