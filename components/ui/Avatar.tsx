import { cn } from "./cn";

export interface AvatarProps {
  /** Display name; used for initials and as alt text */
  name: string;
  /** Stable seed for the colour (defaults to name) */
  seed?: string;
  src?: string;
  size?: number;
  className?: string;
}

const tints = [
  "bg-accent-soft text-accent",
  "bg-grey-200 text-grey-800 [[data-theme=dark]_&]:bg-white/10 [[data-theme=dark]_&]:text-text",
  "bg-success-soft text-success",
  "bg-warn-soft text-warn",
  "bg-grey-800 text-grey-50 [[data-theme=dark]_&]:bg-white/20 [[data-theme=dark]_&]:text-text",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0];
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

export function Avatar({ name, seed, src, size = 40, className }: AvatarProps) {
  const tint = tints[hash(seed ?? name) % tints.length];
  return (
    <span
      role="img"
      aria-label={name}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border font-semibold select-none", !src && tint, className)}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
