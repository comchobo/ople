"use client";

import type { User } from "@/api/core";
import { Modal } from "./modal";

export function AccountDialog({
  user,
  close,
  planners,
}: {
  user: User;
  close: () => void;
  planners: () => void;
}) {
  return (
    <Modal title="내 계정" close={close}>
      <div className="account-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      <div className="account-menu">
        <button type="button" onClick={planners}>
          내 플래너
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("ople:logout"))}
        >
          로그아웃
        </button>
      </div>
    </Modal>
  );
}
