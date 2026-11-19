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
      <div className="mb-4 border-b border-[#d4d4d4] pb-[18px]">
        <h3 className="text-base leading-[1.6] [font-weight:650]">
          {user.name}
        </h3>
        <p>{user.email}</p>
      </div>
      <div className="grid gap-1.5">
        <button
          className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] text-left"
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
          className="min-h-11 cursor-pointer rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] leading-[1.4] hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45] text-left"
          type="button"
          onClick={() => window.dispatchEvent(new Event("ople:logout"))}
        >
          로그아웃
        </button>
      </div>
    </Modal>
  );
}
