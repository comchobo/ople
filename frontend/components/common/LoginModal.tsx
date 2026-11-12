"use client";

import type { RefObject } from "react";
import Modal from "./Modal";

export default function LoginModal({
  dialogRef,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
}) {
  return (
    <Modal dialogRef={dialogRef} title="로그인" titleId="login-title">
      <button type="button" className="primary wide" disabled>
        Google로 계속하기
      </button>
    </Modal>
  );
}
