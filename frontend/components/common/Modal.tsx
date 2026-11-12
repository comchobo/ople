"use client";

import type { ReactNode, RefObject } from "react";

export default function Modal({
  dialogRef,
  title,
  titleId,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  titleId: string;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto max-h-[min(786px,calc(100dvh-48px))] w-[560px] max-w-[calc(100%-48px)] overscroll-contain rounded-[7px] border border-[#999] bg-white p-6 text-(--ink) backdrop:bg-black/30"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={() => dialogRef.current?.close()}>
          닫기
        </button>
      </div>
      {children}
    </dialog>
  );
}
