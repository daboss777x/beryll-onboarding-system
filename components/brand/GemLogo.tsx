import { useId } from "react";
import { cn } from "@/components/ui/cn";

export interface GemLogoProps {
  size?: number;
  /** color: aqua gradient; mono: currentColor facets */
  variant?: "color" | "mono";
  withWordmark?: boolean;
  className?: string;
}

/** Faceted gem mark (top-down brilliant cut) + optional "Beryll" wordmark. */
export function GemMark({ size = 32, variant = "color", className }: Omit<GemLogoProps, "withWordmark">) {
  const uid = useId().replace(/:/g, "");
  const mono = variant === "mono";
  const g1 = mono ? "currentColor" : `url(#${uid}a)`;
  const g2 = mono ? "currentColor" : `url(#${uid}b)`;
  const g3 = mono ? "currentColor" : `url(#${uid}c)`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Beryll gem"
      className={cn("shrink-0", className)}
    >
      {!mono && (
        <defs>
          <linearGradient id={`${uid}a`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7DEBEB" />
            <stop offset="1" stopColor="#2DD4D4" />
          </linearGradient>
          <linearGradient id={`${uid}b`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2DD4D4" />
            <stop offset="1" stopColor="#0B7F80" />
          </linearGradient>
          <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0E9F9F" />
            <stop offset="1" stopColor="#06494A" />
          </linearGradient>
        </defs>
      )}
      {/* crown facets */}
      <path d="M24 3 L10 15 L24 15 Z" fill={g1} opacity={mono ? 0.55 : 1} />
      <path d="M24 3 L38 15 L24 15 Z" fill={g2} opacity={mono ? 0.8 : 1} />
      <path d="M10 15 L3 17 L24 45 L24 15 Z" fill={g3} opacity={mono ? 0.6 : 0.92} />
      <path d="M38 15 L45 17 L24 45 L24 15 Z" fill={g3} opacity={mono ? 0.95 : 1} />
      <path d="M3 17 L10 15 L24 15 L38 15 L45 17 L24 45 Z" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M24 3 L24 15 M10 15 L24 45 M38 15 L24 45" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

export function GemLogo({ size = 32, variant = "color", withWordmark = true, className }: GemLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-text", className)}>
      <GemMark size={size} variant={variant} />
      {withWordmark && (
        <span
          className="font-display font-semibold tracking-tight leading-none"
          style={{ fontSize: Math.round(size * 0.62) }}
        >
          Beryll
        </span>
      )}
    </span>
  );
}
