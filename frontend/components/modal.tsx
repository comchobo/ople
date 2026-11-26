"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";

export function Modal({
  title,
  close,
  children,
  returnFocusRef,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      (returnFocusRef?.current ?? previous)?.focus();
    };
  }, [returnFocusRef]);
  return (
    <dialog
      ref={ref}
      className="m-auto max-h-[calc(100dvh_-_48px)] w-[560px] max-w-[calc(100%_-_48px)] rounded-[7px] border border-[#999] bg-white p-0 text-[#222] overscroll-contain backdrop:bg-black/30"
      onCancel={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-label={title}
    >
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl leading-[1.45] tracking-[-0.5px] [font-weight:650]">
            {title}
          </h2>
          <button
            type="button"
            className="inline-grid min-h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[3px] border border-[#d4d4d4] bg-white p-0 leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
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
