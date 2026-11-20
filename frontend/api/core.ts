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

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
  headers?: Record<string, string>,
): Promise<T> {
  const isJson = body !== undefined && !(body instanceof FormData);
  const requestHeaders = {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    ...(Object.keys(requestHeaders).length ? { headers: requestHeaders } : {}),
    ...(body === undefined
      ? {}
      : { body: body instanceof FormData ? body : JSON.stringify(body) }),
  });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => undefined);
    const detail =
      typeof data === "object" && data !== null && "detail" in data
        ? data.detail
        : undefined;
    const code =
      typeof data === "object" &&
      data !== null &&
      "code" in data &&
      typeof data.code === "string"
        ? data.code
        : undefined;
    throw new ApiError(
      typeof detail === "string"
        ? detail
        : "처리하지 못했습니다. 다시 시도해주세요.",
      response.status,
      code,
      detail,
    );
  }
  return response.json();
}
