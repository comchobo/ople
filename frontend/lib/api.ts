export type User = { id: string; name: string; email: string };
export type Category = "work" | "creative" | "relation" | "rest";
export type Piece = {
  id: string;
  title: string;
  description: string;
  category: Category;
  start: number;
  duration: number;
};
export type ScoreKey = "resources" | "appeal" | "confidence" | "coherence";
export type Plan = {
  kind: string;
  title: string;
  description: string;
  scores: Partial<Record<ScoreKey, number>>;
  pieces: Piece[];
};
export type Planner = {
  id: string;
  name: string;
  created_at: string;
  plans: Plan[];
};
export type Job = {
  id: string;
  status: "pending" | "running" | "failed" | "completed";
  planner_id: string | null;
  error: string | null;
};
export type Answer = { question: string; answer: string; recording_id: string };
export const categories: Record<Category, string> = {
  work: "일",
  creative: "창작",
  relation: "관계",
  rest: "휴식",
};
export const ratingLabels: Record<ScoreKey, string> = {
  resources: "자원",
  appeal: "호감",
  confidence: "자신감",
  coherence: "일관성",
};
export const ratingHelp: Record<ScoreKey, string> = {
  resources: "필요한 시간·비용·역량을 확보할 수 있나요?",
  appeal: "이 삶의 모습에 얼마나 끌리나요?",
  confidence: "실행할 수 있다는 자신감은 어느 정도인가요?",
  coherence: "내 가치와 원하는 삶에 얼마나 맞나요?",
};

export async function api<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    ...(body === undefined
      ? {}
      : body instanceof FormData
        ? { body }
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "처리하지 못했습니다. 다시 시도해주세요.",
    );
  }
  return response.json();
}

// Serialize writes per planner so an older in-flight save cannot overwrite a newer edit.
const saves = new Map<string, Promise<unknown>>();
export function savePlanner(planner: Planner) {
  const value = structuredClone(planner);
  const pending = (saves.get(value.id) ?? Promise.resolve())
    .catch(() => {})
    .then(() =>
      api(
        `/planners/${value.id}`,
        { name: value.name, plans: value.plans },
        "PUT",
      ),
    )
    .catch(() => {});
  saves.set(value.id, pending);
  void pending.finally(() => {
    if (saves.get(value.id) === pending) saves.delete(value.id);
  });
  return pending;
}

export async function flushSaves() {
  while (saves.size) await Promise.all([...saves.values()]);
}

export function formatDate(value: string) {
  return new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`,
  ).toLocaleDateString("ko-KR");
}
