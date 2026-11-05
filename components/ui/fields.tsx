import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "./cn";

const control =
  "w-full rounded-md border border-border-strong bg-surface-strong px-3.5 text-text placeholder:text-muted " +
  "transition focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describe = (id: string, hint?: string, error?: string) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

interface CommonFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, CommonFieldProps {}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, wrapperClassName, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error || undefined}
        aria-describedby={describe(fid, hint, error)}
        className={cn(control, "min-h-11", className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, CommonFieldProps {}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, wrapperClassName, className, id, rows = 4, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={fid}
        rows={rows}
        aria-invalid={!!error || undefined}
        aria-describedby={describe(fid, hint, error)}
        className={cn(control, "py-2.5", className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, CommonFieldProps {}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, wrapperClassName, className, id, children, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={describe(fid, hint, error)}
          className={cn(control, "min-h-11 appearance-none pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown aria-hidden size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: string;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, ...props },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <label htmlFor={fid} className={cn("flex min-h-10 cursor-pointer items-start gap-3 py-1.5", className)}>
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input ref={ref} id={fid} type="checkbox" className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface-strong transition checked:border-accent checked:bg-accent disabled:opacity-50" {...props} />
        <Check aria-hidden size={14} strokeWidth={3} className="pointer-events-none absolute left-[3px] top-[3px] text-on-accent opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
});
