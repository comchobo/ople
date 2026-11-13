"use client";

import type { RefObject } from "react";
import Modal from "./Modal";

export default function AccountModal({
  dialogRef,
  onNavigate,
  onPreviewLogout,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onNavigate: (page: "planners") => void;
  onPreviewLogout?: () => void;
}) {
  return (
    <Modal dialogRef={dialogRef} title="내 계정" titleId="account-title">
      {onPreviewLogout && (
        <div className="mb-4 border-b border-(--line) pb-4">
          <strong>김민수</strong>
          <p className="muted">minsu@example.com</p>
        </div>
      )}
      <button
        type="button"
        className="wide space"
        onClick={() => onNavigate("planners")}
      >
        내 플래너 보기
      </button>
      {onPreviewLogout && (
        <button type="button" className="wide space" onClick={onPreviewLogout}>
          로그아웃
        </button>
      )}
    </Modal>
  );
}
