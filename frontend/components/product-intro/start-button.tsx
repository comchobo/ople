"use client";

import { useRouter } from "next/navigation";
import { useSiteSession } from "../site-header/site-session";

export default function StartButton({
  placement,
}: {
  placement: "top" | "bottom";
}) {
  const router = useRouter();
  const { account, checkingAccount, openLogin } = useSiteSession();

  return (
    <button
      aria-label={placement === "bottom" ? "하단에서 시작하기" : undefined}
      aria-haspopup={account ? undefined : "dialog"}
      className={`mt-6 min-h-11 rounded-md bg-neutral-800 px-5 py-2 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-600 ${placement === "bottom" ? "w-full" : "min-w-50"}`}
      type="button"
      disabled={checkingAccount}
      onClick={(event) => {
        if (account) router.push("/planners");
        else openLogin(event.currentTarget);
      }}
    >
      시작하기
    </button>
  );
}
