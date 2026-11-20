import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "quiet"
  | "icon"
  | "danger";

const base =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-sheet border px-4 py-2.5 text-sm leading-tight font-semibold transition-colors disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-ink bg-ink text-paper hover:border-ink-soft hover:bg-ink-soft",
  secondary:
    "border-faint bg-paper-raised text-ink hover:border-ink hover:bg-paper-deep",
  quiet:
    "border-transparent bg-transparent text-ink underline decoration-rule-strong underline-offset-4 hover:border-rule-strong hover:bg-paper-deep",
  icon: "w-11 border-faint bg-paper-raised p-0 text-ink hover:border-ink hover:bg-paper-deep",
  danger:
    "border-transparent bg-transparent text-c underline decoration-c/40 underline-offset-4 hover:border-c/40 hover:bg-c-soft hover:text-ink",
};

export function buttonClass(
  variant: ButtonVariant = "secondary",
  className?: string,
) {
  return [base, variants[variant], className].filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  className,
  type,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      type={type ?? "button"}
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}
