"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-label={title}
    >
      <div className="sheet-inner">
        <div className="sheet-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={close}
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
