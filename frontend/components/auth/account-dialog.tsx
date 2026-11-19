"use client";

import type { User } from "@/api/core";
import { Modal } from "@/components/modal";
import { useAppNavigation } from "@/hooks/use-app-navigation";

export function AccountDialog({
  user,
  close,
}: {
  user: User;
  close: () => void;
}) {
  const navigate = useAppNavigation();
  return (
    <Modal title="내 계정" close={close}>
      <div className="account-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
      <div className="account-menu">
        <button
          type="button"
          onClick={() => {
            void navigate("/planners").then((moved) => {
              if (moved) close();
            });
          }}
        >
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
