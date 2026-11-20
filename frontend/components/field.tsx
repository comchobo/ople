import type { ReactNode } from "react";

export const controlClass =
  "block min-h-11 w-full rounded-sheet border border-faint bg-paper-raised px-3.5 py-2.5 text-[15px] text-ink caret-ink placeholder:text-muted focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
  spacing = true,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  spacing?: boolean;
}) {
  return (
    <div
      className={[spacing ? "mt-5 first:mt-0" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <label
        className="mb-1.5 block text-[12px] font-semibold tracking-[0.02em] text-ink-soft"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {hint && (
        <p className="mb-2 text-[12px] leading-relaxed text-muted">{hint}</p>
      )}
      {children}
    </div>
  );
}
