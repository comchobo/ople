type Account = { id: string; name: string; email: string; csrf_token: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function account(): Promise<Account> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (!response.ok)
    throw new ApiError(
      response.status === 401
        ? "로그인이 필요합니다."
        : "계정 정보를 불러오지 못했습니다. 다시 시도해주세요.",
      response.status,
    );
  return response.json();
}

export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (method !== "GET") {
    const me = await account();
    headers["X-CSRF-Token"] = me.csrf_token;
  }
  if (body instanceof Blob) headers["Content-Type"] = body.type;
  else if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`/api${path}`, {
    method,
    headers,
    cache: "no-store",
    body:
      body instanceof Blob
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      typeof data.detail === "string"
        ? data.detail
        : "처리하지 못했습니다. 입력을 확인하고 다시 시도해주세요.",
      response.status,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
