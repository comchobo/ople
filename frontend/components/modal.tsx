"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "./button";

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
      className="m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto rounded-sheet border border-ink bg-paper-raised p-0 text-ink shadow-sheet md:max-h-[calc(100dvh-3rem)] md:w-[min(560px,calc(100%-3rem))]"
      onCancel={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-label={title}
    >
      <div className="flex flex-col p-6 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-rule pb-4">
          <h2 className="text-[28px] leading-tight font-bold tracking-[-0.04em]">
            {title}
          </h2>
          <Button
            variant="icon"
            className="shrink-0"
            onClick={close}
            aria-label="닫기"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
