import { Compass, Eye, Gem, Rocket } from "lucide-react";
import { cn } from "./cn";

export type Rank = "observer" | "copilot" | "solo" | "independent";

export const RANKS: Record<Rank, { label: string; blurb: string }> = {
  observer: { label: "Observer", blurb: "Watching and learning" },
  copilot: { label: "Co-pilot", blurb: "Working alongside your buddy" },
  solo: { label: "Solo", blurb: "Certified to work independently" },
  independent: { label: "Independent", blurb: "Day-90 signed off" },
};
const icons = { observer: Eye, copilot: Compass, solo: Rocket, independent: Gem } as const;
const level: Record<Rank, number> = { observer: 0, copilot: 1, solo: 2, independent: 3 };

export interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md";
  className?: string;
}

export function RankBadge({ rank, size = "md", className }: RankBadgeProps) {
  const Icon = icons[rank];
  const high = level[rank] >= 2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border-strong font-medium text-text",
        high ? "bg-prism shadow-glow" : "bg-accent-soft",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        className,
      )}
    >
      <Icon aria-hidden size={size === "sm" ? 14 : 16} className="text-accent" />
      {RANKS[rank].label}
    </span>
  );
}
