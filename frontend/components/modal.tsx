"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

import { buttonClass } from "./ui-styles";

function keepFocusWithin(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab" || event.defaultPrevented) return;
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "button:not(:disabled), a[href], input:not(:disabled):not([type='hidden']), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])",
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="m-auto max-h-[min(786px,calc(100dvh-48px))] w-[560px] max-w-[calc(100%-48px)] overscroll-contain rounded-[7px] border border-[#999] bg-white p-0 text-[#222] backdrop:bg-black/30 motion-safe:transition-[opacity,translate] motion-safe:duration-150 motion-safe:ease-out motion-safe:starting:translate-y-2 motion-safe:starting:opacity-0"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        keepFocusWithin(event);
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-[20px] leading-[1.45] font-[650] tracking-[-0.5px]"
            id={titleId}
          >
            {title}
          </h2>
          <button className={buttonClass} type="button" onClick={onClose}>
            닫기
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
