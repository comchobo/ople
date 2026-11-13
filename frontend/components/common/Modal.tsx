"use client";

import type { KeyboardEvent, ReactNode, RefObject } from "react";

function keepTabInside(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab" || event.defaultPrevented) return;

  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]',
    ),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest("[inert]") &&
      element.checkVisibility({ visibilityProperty: true }),
  );
  const first = controls[0];
  const last = controls.at(-1);
  const edge = event.shiftKey ? first : last;
  if (event.target !== edge) return;

  event.preventDefault();
  (event.shiftKey ? last : first)?.focus();
}

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
      closedby="any"
      aria-labelledby={titleId}
      onKeyDown={keepTabInside}
      className="m-auto max-h-[min(786px,calc(100dvh-48px))] w-[560px] max-w-[calc(100%-48px)] overflow-auto overscroll-contain rounded-[7px] border border-[#999] bg-white p-6 text-(--ink) backdrop:bg-black/30"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        <button type="button" onClick={() => dialogRef.current?.close()}>
          닫기
        </button>
      </div>
      {children}
    </dialog>
  );
}
