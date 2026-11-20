"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function Modal({
  title,
  close,
  children,
  dismissible = true,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  dismissible?: boolean;
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
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (dismissible) close();
        }
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) close();
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
            disabled={!dismissible}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
