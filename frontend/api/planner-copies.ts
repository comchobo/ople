import { ApiError, api, type Planner } from "./core";

export { ApiError as PlannerCopyError } from "./core";

export type PlannerCopyInput = Readonly<{ name?: string }>;

function isNameIssue(issue: unknown): boolean {
  return (
    typeof issue === "object" &&
    issue !== null &&
    "loc" in issue &&
    Array.isArray(issue.loc) &&
    issue.loc[0] === "body" &&
    issue.loc[1] === "name"
  );
}

export function isPlannerCopyNameError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    ((error.status === 422 && error.code === "COPY_NAME_TOO_LONG") ||
      (error.status === 409 && error.code === "COPY_NAME_EXISTS") ||
      (error.status === 422 &&
        Array.isArray(error.detail) &&
        error.detail.length > 0 &&
        error.detail.every(isNameIssue)))
  );
}

function nameValidationMessage(detail: unknown): string {
  return Array.isArray(detail) && detail.length > 0 && detail.every(isNameIssue)
    ? "이름을 확인해주세요. 앞뒤 공백을 제외한 이름을 1~100자로 입력해주세요."
    : "복제 요청을 처리하지 못했습니다. 다시 시도해주세요.";
}

export async function copyPlanner(
  sourceId: string,
  requestKey: string,
  input: PlannerCopyInput = {},
): Promise<Planner> {
  try {
    return await api<Planner>(
      `/planners/${encodeURIComponent(sourceId)}/duplicate`,
      input,
      "POST",
      { "Idempotency-Key": requestKey },
    );
  } catch (cause) {
    if (cause instanceof ApiError && Array.isArray(cause.detail)) {
      throw new ApiError(
        nameValidationMessage(cause.detail),
        cause.status,
        cause.code,
        cause.detail,
      );
    }
    throw cause;
  }
}
