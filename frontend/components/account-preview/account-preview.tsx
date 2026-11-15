"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readPreviewAccount } from "./preview-account";

export default function AccountPreview() {
  const [account, setAccount] =
    useState<Awaited<ReturnType<typeof readPreviewAccount>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const callbackError = new URLSearchParams(window.location.search).get(
      "error",
    );
    setLoading(true);
    setError(
      callbackError === "cancelled"
        ? "로그인이 취소되었습니다."
        : callbackError === "failed"
          ? "로그인에 실패했습니다. 다시 시도해 주세요."
          : "",
    );
    readPreviewAccount(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setAccount(value);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("계정 정보를 확인할 수 없습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function logout() {
    if (!account) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": account.csrf_token },
        credentials: "same-origin",
      });
      if (!response.ok && response.status !== 401) throw new Error();
      window.location.replace("/tmp/preview/implementation");
    } catch {
      setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">내 계정</h1>
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="mt-4">
          계정을 확인하는 중입니다.
        </p>
      ) : account ? (
        <section className="mt-4 space-y-3">
          <h2 className="font-semibold">{account.name || "계정 정보"}</h2>
          <p>{account.email}</p>
          <div className="flex gap-4">
            <Link href="/planners" className="underline">
              내 플래너
            </Link>
            <button type="button" className="underline" onClick={logout}>
              로그아웃
            </button>
          </div>
        </section>
      ) : (
        <div className="mt-4 flex gap-4">
          <a href="/api/auth/login" className="underline">
            Google로 로그인
          </a>
          {error && (
            <button
              type="button"
              className="underline"
              onClick={() => window.location.reload()}
            >
              계정 다시 확인
            </button>
          )}
        </div>
      )}
    </main>
  );
}
