import type { ReactNode } from "react";

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "error" | "info";
  children: ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-c/40 bg-c-soft/50"
      : "border-rule bg-paper-raised";
  return (
    <div
      className={`px-4 py-3 text-sm leading-relaxed text-ink ${styles}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
