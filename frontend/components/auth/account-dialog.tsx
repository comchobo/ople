"use client";

import type { User } from "@/api/core";
import { Button } from "@/components/button";
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
      <div className="mb-5 border-b border-rule pb-5">
        <h3 className="text-[20px] leading-snug font-bold tracking-[-0.03em]">
          {user.name}
        </h3>
        <p className="mt-1 text-[13px] text-muted">{user.email}</p>
      </div>
      <div className="grid gap-2">
        <Button
          variant="secondary"
          className="justify-start"
          onClick={() => {
            void navigate("/planners").then((moved) => {
              if (moved) close();
            });
          }}
        >
          내 플래너
        </Button>
        <Button
          variant="quiet"
          className="justify-start"
          onClick={() => window.dispatchEvent(new Event("ople:logout"))}
        >
          로그아웃
        </Button>
      </div>
    </Modal>
  );
}
