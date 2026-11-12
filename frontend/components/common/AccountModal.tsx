"use client";

import type { RefObject } from "react";
import Modal from "./Modal";

export default function AccountModal({
  dialogRef,
  onNavigate,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onNavigate: (page: "planners") => void;
}) {
  return (
    <Modal dialogRef={dialogRef} title="내 계정" titleId="account-title">
      <p className="muted">계정 화면을 준비하고 있습니다.</p>
      <button
        type="button"
        className="wide space"
        onClick={() => onNavigate("planners")}
      >
        내 플래너 보기
      </button>
    </Modal>
  );
}
