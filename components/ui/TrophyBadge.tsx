"use client";

import { motion } from "framer-motion";
import { Crown, Diamond, Gem, Lock } from "lucide-react";
import { cn } from "./cn";

export type TrophyTier = "facet" | "gem" | "crown";

export interface TrophyBadgeProps {
  tier?: TrophyTier;
  title: string;
  description?: string;
  locked?: boolean;
  size?: "sm" | "md" | "lg";
  /** Animate in (pop) when it is first shown */
  celebrate?: boolean;
  className?: string;
}

const icons = { facet: Diamond, gem: Gem, crown: Crown } as const;
const dims = { sm: 56, md: 80, lg: 112 } as const;
const HEX = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";

/** Gold is reserved for trophies and rewards: this is the only place it is used as a fill. */
export function TrophyBadge({ tier = "gem", title, description, locked, size = "md", celebrate, className }: TrophyBadgeProps) {
  const Icon = locked ? Lock : icons[tier];
  const d = dims[size];
  return (
    <div className={cn("flex w-full max-w-40 flex-col items-center gap-2 text-center", className)} aria-label={`${title}${locked ? " (locked)" : ""}`}>
      <motion.div
        initial={celebrate ? { scale: 0.4, rotate: -12, opacity: 0 } : false}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        style={{ width: d, height: d, clipPath: HEX }}
        className={cn(
          "relative flex items-center justify-center",
          locked ? "bg-grey-300 text-grey-600 [[data-theme=dark]_&]:bg-white/10 [[data-theme=dark]_&]:text-muted" : "bg-gradient-to-br from-gold-light via-gold to-gold-dark text-grey-900",
        )}
      >
        {!locked && <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent [clip-path:polygon(50%_0%,93%_25%,50%_50%,7%_25%)]" />}
        <Icon aria-hidden size={d * 0.38} strokeWidth={tier === "crown" ? 2 : 1.75} className="relative" />
      </motion.div>
      <div>
        <p className={cn("text-sm font-semibold leading-tight", locked && "text-muted")}>{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
    </div>
  );
}
