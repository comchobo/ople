"use client";

import { CircleUserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  flushSaves,
  formatDate,
  type Job,
  type Planner,
  savePlanner,
  type User,
} from "@/lib/api";
import { Auth } from "./auth";
import { Board } from "./board";
import { Interview } from "./interview";
import { Modal } from "./modal";

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

export function Ople() {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  const [view, setView] = useState<
    "intro" | "planners" | "interview" | "board"
  >("intro");
  const [auth, setAuth] = useState(false),
    [account, setAccount] = useState(false);
  const [planners, setPlanners] = useState<Planner[]>([]),
    [jobs, setJobs] = useState<Job[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null),
    [rename, setRename] = useState<Planner | null>(null);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const accountVersion = useRef(0);
  const revision = useRef(0);
  const localEdits = useRef(new Map<string, number>());
  const refresh = useCallback(async () => {
    const accountAtStart = accountVersion.current;
    await flushSaves();
    const revisionAtStart = revision.current;
    const [values, tasks] = await Promise.all([
      api<Planner[]>("/planners"),
      api<Job[]>("/generations"),
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
    void api<User>("/auth/me")
      .then(async (value) => {
        if (alive.current) {
          setUser(value);
          setView("planners");
          await refresh();
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive.current) setLoading(false);
      });
    if (new URLSearchParams(window.location.search).has("auth_error")) {
      setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
      window.history.replaceState(null, "", "/");
    }
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (view !== "planners" || !jobs.some((job) => job.status === "running"))
      return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [jobs, view, refresh]);
  function navigate(next: typeof view) {
    if (
      view === "interview" &&
      !window.confirm("인터뷰를 나가면 이어할 수 없습니다. 나갈까요?")
    )
      return;
    setView(next);
    setError("");
    if (next === "planners")
      void refresh().catch((cause) => setError(cause.message));
  }
  async function logout() {
    if (
      view === "interview" &&
      !window.confirm("인터뷰를 종료하고 로그아웃할까요?")
    )
      return;
    try {
      await flushSaves();
      await api("/auth/logout", {});
      accountVersion.current += 1;
      setUser(null);
      setPlanners([]);
      setJobs([]);
      setAccount(false);
      setView("intro");
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  function changed(value: Planner) {
    localEdits.current.set(value.id, ++revision.current);
    setPlanners((previous) =>
      previous.map((item) => (item.id === value.id ? value : item)),
    );
    void savePlanner(value);
  }
  async function generated(job: Job) {
    const accountAtStart = accountVersion.current;
    await refresh();
    if (accountAtStart !== accountVersion.current) return;
    if (job.status === "completed" && job.planner_id) {
      setActiveId(job.planner_id);
      setView("board");
    } else {
      setView("planners");
      if (job.error) setError(job.error);
    }
  }
  const active = planners.find((item) => item.id === activeId);
  return (
    <div id="app" className={view}>
      <header className="site-header">
        <a
          href="/"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            navigate("intro");
          }}
        >
          Ople
        </a>
        <nav className="header-links" aria-label="계정 메뉴">
          {user ? (
            <>
              <button
                type="button"
                className="text-button"
                onClick={() => navigate("planners")}
              >
                내 플래너
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="계정"
                onClick={() => setAccount(true)}
              >
                <CircleUserRound />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setAuth(true)}>
              로그인
            </button>
          )}
        </nav>
      </header>
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
                start={() => (user ? navigate("planners") : setAuth(true))}
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
                            setJobs((previous) =>
                              previous.map((item) =>
                                item.id === job.id
                                  ? { ...item, status: "running" }
                                  : item,
                              ),
                            );
                            try {
                              await generated(
                                await api<Job>(
                                  `/generations/${job.id}/run`,
                                  {},
                                ),
                              );
                            } catch (cause) {
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
                                setActiveId(planner.id);
                                setView("board");
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
                                await api(
                                  `/planners/${planner.id}`,
                                  undefined,
                                  "DELETE",
                                );
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
                    onClick={() => void logout()}
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
      {auth && (
        <Auth
          close={() => setAuth(false)}
          loggedIn={(value) => {
            accountVersion.current += 1;
            setUser(value);
            setAuth(false);
            setView("planners");
            void refresh().catch((cause) => setError(cause.message));
          }}
        />
      )}
      {account && user && (
        <Modal title="내 계정" close={() => setAccount(false)}>
          <div className="account-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <div className="account-menu">
            <button
              type="button"
              onClick={() => {
                setAccount(false);
                navigate("planners");
              }}
            >
              내 플래너
            </button>
            <button type="button" onClick={() => void logout()}>
              로그아웃
            </button>
          </div>
        </Modal>
      )}
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
    </div>
  );
}
