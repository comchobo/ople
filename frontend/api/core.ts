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
