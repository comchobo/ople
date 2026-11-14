"use client";

// TEMP #55: isolated auth/entry preview; remove after shared navigation integration.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import s from "@/components/planner/feature.module.css";
import { ApiError, account, api } from "@/lib/api";

export default function Preview() {
  const [me, setMe] = useState<Awaited<ReturnType<typeof account>> | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMe(await account());
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401)
        setError((e as Error).message);
      else setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    if (window.location.search.includes("error="))
      setError("로그인이 취소되었거나 실패했습니다. 다시 시도해주세요.");
  }, [load]);
  async function logout() {
    setLoading(true);
    try {
      await api("/auth/logout", "POST");
      setMe(null);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className={s.surface}>
      <div className={s.content}>
        <h1>계정·기능 미리보기</h1>
        <p className={s.notice}>
          임시 연결 화면입니다. #55에서 최종 공통 화면으로 통합합니다.
        </p>
        {error && (
          <p role="alert" className={s.error}>
            {error}{" "}
            <button type="button" onClick={load}>
              다시 확인
            </button>
          </p>
        )}
        {loading ? (
          <p role="status">계정을 확인하는 중입니다.</p>
        ) : me ? (
          <section>
            <h2>{me.name || "내 계정"}</h2>
            <p>{me.email}</p>
            <div className={s.actions}>
              <Link href="/planners">내 플래너</Link>
              <button type="button" onClick={logout}>
                로그아웃
              </button>
            </div>
          </section>
        ) : (
          <a href="/api/auth/login">Google로 로그인</a>
        )}
      </div>
    </main>
  );
}
