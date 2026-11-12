"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { createdLabel, type Planner } from "@/lib/product";
import s from "./feature.module.css";

export function PlannerList() {
  const [rows, setRows] = useState<Planner[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Planner | null>(null);
  const [name, setName] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await api<Planner[]>("/planners"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await api(`/planners/${editing.id}`, "PATCH", { name });
      setRows(
        (list) =>
          list?.map((p) =>
            p.id === editing.id ? { ...p, name: name.trim() } : p,
          ) ?? null,
      );
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(planner: Planner) {
    if (
      !confirm(
        `'${planner.name}'와 계획·조각·평가를 삭제할까요? 보관된 음성 원본은 삭제되지 않습니다.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api(`/planners/${planner.id}`, "DELETE");
      setRows((list) => list?.filter((p) => p.id !== planner.id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={s.surface}>
      <div className={s.content}>
        <div className={s.heading}>
          <div>
            <h1>내 플래너</h1>
            <p className={s.muted}>
              앞으로의 5년, 여러 가지 가능성을 나란히 탐색하세요.
            </p>
          </div>
          <Link href="/interviews/new">새 플래너 만들기</Link>
        </div>
        {error && (
          <div role="alert" className={s.error}>
            {error}{" "}
            <button type="button" onClick={load} disabled={busy}>
              목록 다시 불러오기
            </button>{" "}
            <Link href="/tmp/preview/implementation">로그인·계정</Link>
          </div>
        )}
        {editing && (
          <form className={s.editor} onSubmit={rename}>
            <h2>이름 변경</h2>
            <label>
              플래너 이름
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className={s.actions}>
              <button
                type="submit"
                className={s.primary}
                disabled={busy || !name.trim()}
              >
                저장
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                취소
              </button>
            </div>
          </form>
        )}
        {!rows && !error && <p role="status">목록을 불러오는 중입니다.</p>}
        {rows?.length === 0 && (
          <section className={s.empty}>
            <h2>아직 플래너가 없어요</h2>
            <p>
              10개의 질문에 답하고 서로 다른 세 가지 삶의 방향을 만들어보세요.
            </p>
            <Link href="/interviews/new">첫 플래너 만들기</Link>
          </section>
        )}
        {rows && rows.length > 0 && (
          <>
            <p className={s.muted}>플래너 {rows.length}개 · 최신 생성순</p>
            <ul className={s.list}>
              {rows.map((p) => (
                <li key={p.id}>
                  <div>
                    <h2>
                      <Link href={`/planners/${p.id}`}>{p.name}</Link>
                    </h2>
                    <span className={s.muted}>
                      {createdLabel(p.created_at)} 생성
                    </span>
                  </div>
                  <div className={s.actions}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditing(p);
                        setName(p.name);
                      }}
                    >
                      이름 변경
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => remove(p)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
