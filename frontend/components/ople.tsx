"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Job, Planner } from "@/api/core";
import { listGenerations, runGeneration } from "@/api/generations";
import {
  deletePlanner,
  flushSaves,
  listPlanners,
  savePlanner,
} from "@/api/planners";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/date";
import { Board } from "./board";
import { Interview } from "./interview";
import { Modal } from "./modal";
import { useAppNavigation } from "./navigation";

function Intro({ start }: { start: () => void }) {
  return (
    <div className="intro-layout">
      <section>
        <div className="intro-hero">
          <p className="small muted">ODYSSEY PLANNING</p>
          <h1>
            하나의 정답 대신,
            <br />세 가지 삶의 가능성
          </h1>
          <p>
            앞으로의 5년, 어떤 삶을 살고 싶나요? 지금의 나에서 출발해 서로 다른
            미래를 그리고, 작은 실험으로 가능성을 탐색해보세요.
          </p>
          <button type="button" className="primary" onClick={start}>
            나의 플래너 시작하기
          </button>
        </div>
        <section className="intro-section">
          <h2>인생에는 여러 가지 좋은 길이 있습니다</h2>
          <p>
            오디세이 플래닝은 서로 다른 세 가지 5년 계획을 그리며 원하는 삶을
            탐색하는 방법입니다. 일뿐 아니라 창작, 관계, 휴식을 함께 생각합니다.
          </p>
          {[
            [
              "A",
              "현재 방향을 발전시키는 계획",
              "지금의 삶에서 소중한 것을 지키며 더 나은 방향으로 이어갑니다.",
            ],
            [
              "B",
              "다른 방향을 탐색하는 계획",
              "지금의 길을 갈 수 없다면, 또 어떤 가능성이 있을까요?",
            ],
            [
              "C",
              "원하는 삶에서 출발하는 계획",
              "돈이나 타인의 시선에서 한 걸음 떨어져 원하는 모습을 그립니다.",
            ],
          ].map(([number, title, description]) => (
            <div className="numbered" key={number}>
              <span className="number">{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="intro-section">
          <h2>말로 풀고, 눈으로 보고, 직접 바꿔보세요</h2>
          <p>
            10개의 질문에 답하면 AI가 이야기를 정리하고 세 가지 계획을 만듭니다.
            활동을 더하고 옮기면서 나만의 계획으로 발전시킬 수 있습니다.
          </p>
        </section>
      </section>
      <section>
        <h2>결과 예시</h2>
        <p className="muted small space">일을 이어가며 생활의 여유 만들기</p>
        <div className="example space">
          <div className="years">
            <span>1년차</span>
            <span>3년차</span>
            <span>5년차</span>
          </div>
          {[
            ["업무 경계 정하기", "0%", "30%"],
            ["주말 창작 활동", "10%", "50%"],
            ["가까운 사람들과 시간", "0%", "100%"],
            ["다른 지역에서 한 달 살기", "65%", "20%"],
          ].map(([label, left, width]) => (
            <div className="sample-row" key={label}>
              {label}
              <div className="sample-bar" style={{ marginLeft: left, width }} />
            </div>
          ))}
        </div>
        <section className="intro-section">
          <h2>이렇게 진행해요</h2>
          <div className="numbered">
            <span>01</span>
            <div>
              <h3>나의 이야기</h3>
              <p>음성으로 질문에 답합니다.</p>
            </div>
          </div>
          <div className="numbered">
            <span>02</span>
            <div>
              <h3>세 가지 미래</h3>
              <p>나의 답변으로 서로 다른 계획을 만듭니다.</p>
            </div>
          </div>
          <div className="numbered">
            <span>03</span>
            <div>
              <h3>작은 실험부터</h3>
              <p>타임라인을 편집하고 먼저 해볼 일을 찾습니다.</p>
            </div>
          </div>
          <button type="button" className="primary wide space" onClick={start}>
            시작하기
          </button>
        </section>
      </section>
    </div>
  );
}

type View = "intro" | "planners" | "interview" | "board";
export function Ople({
  view = "intro",
  plannerId,
}: {
  view?: View;
  plannerId?: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const move = useAppNavigation();
  const [dataLoading, setDataLoading] = useState(
    view === "planners" || view === "board",
  );
  const [planners, setPlanners] = useState<Planner[]>([]),
    [jobs, setJobs] = useState<Job[]>([]);
  const [rename, setRename] = useState<Planner | null>(null);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const authenticated = useRef(false);
  const accountVersion = useRef(0);
  const revision = useRef(0);
  const localEdits = useRef(new Map<string, number>());
  const refresh = useCallback(async () => {
    const accountAtStart = accountVersion.current;
    await flushSaves();
    const revisionAtStart = revision.current;
    const [values, tasks] = await Promise.all([
      listPlanners(),
      listGenerations(),
    ]);
    if (alive.current && accountAtStart === accountVersion.current) {
      setPlanners((current) =>
        values.map((value) =>
          (localEdits.current.get(value.id) ?? 0) > revisionAtStart
            ? (current.find((item) => item.id === value.id) ?? value)
            : value,
        ),
      );
      setJobs(tasks);
    }
    return values;
  }, []);
  useEffect(() => {
    alive.current = true;
    if (!authLoading && view !== "intro") {
      if (!user) {
        if (!authenticated.current)
          window.dispatchEvent(new Event("ople:login"));
        void move("/", true, true);
      } else if (view === "planners" || view === "board") {
        authenticated.current = true;
        setDataLoading(true);
        void refresh()
          .catch((cause: Error) => {
            if (!alive.current) return;
            if (view === "board") void move("/planners", true, true);
            else setError(cause.message);
          })
          .finally(() => {
            if (alive.current) setDataLoading(false);
          });
      }
      if (user) authenticated.current = true;
    }
    return () => {
      alive.current = false;
      accountVersion.current += 1;
    };
  }, [authLoading, user, view, refresh, move]);
  useEffect(() => {
    if (
      view === "board" &&
      user &&
      !dataLoading &&
      !planners.some((item) => item.id === plannerId)
    ) {
      void move("/planners", true, true);
    }
  }, [view, user, dataLoading, planners, plannerId, move]);
  useEffect(() => {
    if (view !== "planners" || !jobs.some((job) => job.status === "running"))
      return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [jobs, view, refresh]);
  function navigate(next: View) {
    void move(
      next === "intro"
        ? "/"
        : next === "interview"
          ? "/planners/new"
          : "/planners",
    );
  }
  function changed(value: Planner) {
    localEdits.current.set(value.id, ++revision.current);
    setPlanners((previous) =>
      previous.map((item) => (item.id === value.id ? value : item)),
    );
    void savePlanner(value);
  }
  async function generated(job: Job) {
    if (job.status === "completed" && job.planner_id) {
      await move(
        `/planners/${encodeURIComponent(job.planner_id)}`,
        false,
        true,
      );
    } else {
      if (view === "planners") await refresh();
      else await move("/planners", false, true);
    }
  }
  const active = planners.find((item) => item.id === plannerId);
  const loading = authLoading || (view !== "intro" && (!user || dataLoading));
  return (
    <>
      <main>
        {loading ? (
          <p>불러오는 중…</p>
        ) : (
          <>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {view === "intro" && (
              <Intro
                start={() =>
                  user
                    ? navigate("planners")
                    : window.dispatchEvent(new Event("ople:login"))
                }
              />
            )}
            {view === "planners" && (
              <>
                <div className="planner-heading">
                  <div>
                    <h1>내 플래너</h1>
                    <p>여러 가능성을 만들고, 다시 꺼내보세요.</p>
                  </div>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => navigate("interview")}
                  >
                    새 플래너 만들기
                  </button>
                </div>
                <p className="planner-count">플래너 {planners.length}개</p>
                {jobs
                  .filter((job) => job.status !== "completed")
                  .map((job) => (
                    <div className="notice row between" key={job.id}>
                      <span>
                        {job.status === "running"
                          ? "플래너 생성 중…"
                          : job.error || "생성을 시작할 수 있습니다."}
                      </span>
                      {job.status !== "running" && (
                        <button
                          type="button"
                          onClick={async () => {
                            const accountAtStart = accountVersion.current;
                            setJobs((previous) =>
                              previous.map((item) =>
                                item.id === job.id
                                  ? { ...item, status: "running" }
                                  : item,
                              ),
                            );
                            try {
                              const result = await runGeneration(job.id);
                              if (
                                !alive.current ||
                                accountAtStart !== accountVersion.current
                              )
                                return;
                              await generated(result);
                            } catch (cause) {
                              if (
                                !alive.current ||
                                accountAtStart !== accountVersion.current
                              )
                                return;
                              setError((cause as Error).message);
                              await refresh();
                            }
                          }}
                        >
                          다시 시도
                        </button>
                      )}
                    </div>
                  ))}
                {planners.length ? (
                  <ul className="planner-list">
                    {planners.map((planner) => (
                      <li className="planner-item" key={planner.id}>
                        <div className="planner-info">
                          <h2>
                            <button
                              type="button"
                              className="planner-open"
                              onClick={() => {
                                void move(
                                  `/planners/${encodeURIComponent(planner.id)}`,
                                );
                              }}
                            >
                              {planner.name}
                            </button>
                          </h2>
                          <p>{formatDate(planner.created_at)}</p>
                        </div>
                        <div className="planner-row-actions">
                          <button
                            type="button"
                            onClick={() => setRename(planner)}
                          >
                            이름 변경
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `‘${planner.name}’ 플래너를 삭제할까요?`,
                                )
                              )
                                return;
                              try {
                                await deletePlanner(planner.id);
                                setPlanners((previous) =>
                                  previous.filter(
                                    (item) => item.id !== planner.id,
                                  ),
                                );
                              } catch (cause) {
                                setError((cause as Error).message);
                              }
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="planner-empty">
                    <h2>아직 플래너가 없어요</h2>
                    <p>첫 번째 인터뷰로 나의 가능성을 탐색해보세요.</p>
                  </div>
                )}
                <footer className="site-footer">
                  <span>플래너는 계정에 저장됩니다.</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      window.dispatchEvent(new Event("ople:logout"))
                    }
                  >
                    로그아웃
                  </button>
                </footer>
              </>
            )}
            {view === "interview" && (
              <Interview
                exit={() => navigate("planners")}
                generated={(job) => {
                  void generated(job).catch((cause) => setError(cause.message));
                }}
              />
            )}
            {view === "board" && active && (
              <Board
                key={active.id}
                planner={active}
                change={changed}
                list={() => navigate("planners")}
                create={() => navigate("interview")}
              />
            )}
          </>
        )}
      </main>
      {rename && (
        <Modal title="플래너 이름 변경" close={() => setRename(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              changed({ ...rename, name: rename.name.trim() });
              setRename(null);
            }}
          >
            <label className="field" htmlFor="planner-name">
              이름
            </label>
            <input
              id="planner-name"
              required
              maxLength={100}
              value={rename.name}
              onChange={(event) =>
                setRename({ ...rename, name: event.target.value })
              }
            />
            <div className="sheet-footer">
              <button
                type="submit"
                className="primary"
                disabled={!rename.name.trim()}
              >
                변경
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
