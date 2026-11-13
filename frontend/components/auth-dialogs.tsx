import type { AuthUser } from "../lib/auth";
import { Modal } from "./modal";
import { buttonClass, primaryButtonClass } from "./ui-styles";

export function LoginDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="로그인" onClose={onClose}>
      <p className="mb-5 text-[14px] text-[#555]">
        로그인 기능 준비 중입니다. Google 로그인은 추후 제공됩니다.
      </p>
      <button type="button" className={`${primaryButtonClass} w-full`} disabled>
        Google로 계속하기
      </button>
    </Modal>
  );
}

export function AccountDialog({
  user,
  onClose,
  onPlanners,
  onLogout,
  loggingOut,
  logoutError,
}: {
  user: AuthUser;
  onClose: () => void;
  onPlanners: () => void;
  onLogout?: () => Promise<void>;
  loggingOut: boolean;
  logoutError: boolean;
}) {
  return (
    <Modal title="내 계정" onClose={onClose}>
      <div className="mb-4 border-b border-[#d4d4d4] pb-[18px] [overflow-wrap:anywhere]">
        <strong>{user.name}</strong>
        <p className="text-[12px] text-[#666]">{user.email}</p>
      </div>
      <div className="grid gap-1.5">
        <button
          className={`${buttonClass} text-left`}
          type="button"
          onClick={onPlanners}
        >
          내 플래너 보기
        </button>
        <button
          type="button"
          className={`${buttonClass} text-left`}
          onClick={onLogout}
          disabled={!onLogout || loggingOut}
        >
          {loggingOut ? "로그아웃 중…" : "로그아웃"}
        </button>
      </div>
      {logoutError && (
        <p className="mb-5 text-[14px] text-[#555]" role="alert">
          로그아웃하지 못했습니다. 다시 시도해주세요.
        </p>
      )}
    </Modal>
  );
}
