export async function readPreviewAccount(signal?: AbortSignal) {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });

  if (response.status === 401) return null;
  if (!response.ok) throw new Error("계정 정보를 확인할 수 없습니다.");

  return (await response.json()) as {
    id: string;
    name: string;
    email: string;
    csrf_token: string;
  };
}
