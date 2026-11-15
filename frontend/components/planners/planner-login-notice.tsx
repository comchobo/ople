"use client";

import { useSiteSession } from "../site-header/site-session";

export default function PlannerLoginNotice() {
  const { account, checkingAccount } = useSiteSession();

  if (checkingAccount || account) return null;

  return (
    <p className="mt-4 text-neutral-600">
      상단의 ‘로그인’ 버튼을 눌러 로그인한 뒤 내 플래너를 확인해 주세요.
    </p>
  );
}
