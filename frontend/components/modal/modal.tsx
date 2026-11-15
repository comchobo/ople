"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

function wrapTabFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab" || event.defaultPrevented) return;

  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "button, a[href], input:not([type=hidden]), select, textarea, summary, [tabindex]",
    ),
  )
    .filter(
      (control) =>
        control.tabIndex >= 0 &&
        !control.matches(":disabled") &&
        !control.closest("[inert]") &&
        control.checkVisibility({ visibilityProperty: true }),
    )
    .sort(
      (left, right) =>
        (left.tabIndex || Infinity) - (right.tabIndex || Infinity),
    );
  const first = controls[0];
  const last = controls.at(-1);

  if (event.shiftKey && document.activeElement === first && last) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last && first) {
    event.preventDefault();
    first.focus();
  }
}

export default function Modal({
  title,
  children,
  onDismiss,
  opener,
}: {
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  opener: HTMLElement;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPressed = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => {
      dialog.close();
      if (opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [opener]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="m-auto max-h-[calc(100dvh-3rem)] w-[calc(100%-3rem)] max-w-xl overflow-auto rounded-lg border border-neutral-300 bg-white p-0 text-neutral-800 backdrop:bg-black/45"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onKeyDown={wrapTabFocus}
      onPointerDown={(event) => {
        backdropPressed.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (backdropPressed.current && event.target === event.currentTarget) {
          onDismiss();
        }
        backdropPressed.current = false;
      }}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            className="min-h-11 rounded-md border border-neutral-300 px-3 text-sm font-semibold focus-visible:border-neutral-800 focus-visible:bg-neutral-800 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800"
            onClick={onDismiss}
          >
            닫기
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
