import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[0_1px_0_rgba(255,255,255,0.35)_inset] hover:bg-accent-hover hover:shadow-glow",
  secondary: "glass text-text hover:border-border-strong hover:bg-surface-strong",
  ghost: "bg-transparent text-text hover:bg-accent-soft",
  danger: "bg-danger text-white hover:brightness-110 [[data-theme=dark]_&]:text-grey-900",
};
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 text-sm gap-1.5",
  md: "min-h-11 px-5 text-sm gap-2",
  lg: "min-h-12 px-6 text-base gap-2.5",
};

/** Class string for styling links (e.g. next/link) as buttons. */
export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap select-none cursor-pointer",
    "transition duration-150 motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, leftIcon, rightIcon, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={16} aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
