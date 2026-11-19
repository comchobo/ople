import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { isInterviewActive } from "@/hooks/use-app-navigation";
import { useInterview } from "./use-interview";

it("10개 녹음 답변을 요약하고 같은 작업 ID로 생성 재시도한다", async () => {
  let runs = 0;
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) => {
      if (String(path).endsWith("/run")) {
        if (++runs === 1)
          return new Response('{"detail":"생성 실패"}', { status: 502 });
        return new Response(
          JSON.stringify({
            id: "j",
            status: "completed",
            planner_id: "p",
            error: null,
          }),
        );
      }
      const value =
        path === "/api/interview/question"
          ? { question: "원하는 삶은?" }
          : path === "/api/interview/summary"
            ? { summary: "답변 요약" }
            : path === "/api/interview/recording"
              ? { text: "답변", recording_id: "r" }
              : {};
      return new Response(JSON.stringify(value));
    });
  const generated = vi.fn();
  const { result, unmount } = renderHook(() => useInterview(generated));
  expect(isInterviewActive()).toBe(true);
  await act(async () => {
    await result.current.start();
  });
  for (let index = 0; index < 10; index++) {
    await act(async () => {
      await result.current.submit(
        new Blob(["audio"], { type: "audio/webm" }),
        3,
      );
    });
  }
  expect(result.current.phase).toBe("summary");
  expect(result.current.summary).toBe("답변 요약");
  const summaryCall = fetcher.mock.calls.find(
    ([path]) => path === "/api/interview/summary",
  );
  const summaryBody = JSON.parse(String(summaryCall?.[1]?.body));
  expect(summaryBody.answers).toHaveLength(10);
  expect(summaryBody.answers[9]).toEqual({
    question: "원하는 삶은?",
    answer: "답변",
    recording_id: "r",
  });
  await act(async () => {
    await result.current.generate();
  });
  expect(result.current.error).toBe("생성 실패");
  expect(isInterviewActive()).toBe(false);
  await act(async () => {
    await result.current.retry();
  });
  expect(generated).toHaveBeenCalledWith(
    expect.objectContaining({ status: "completed", planner_id: "p" }),
  );
  const creates = fetcher.mock.calls.filter(([path]) =>
    /^\/api\/generations\/[^/]+$/.test(String(path)),
  );
  expect(creates).toHaveLength(2);
  expect(creates[0][1]?.body).toBe(creates[1][1]?.body);
  expect(JSON.parse(String(creates[0][1]?.body))).toEqual(
    expect.objectContaining({
      interview_id: summaryBody.interview_id,
      answers: summaryBody.answers,
      summary: "답변 요약",
    }),
  );
  const uploads = fetcher.mock.calls.filter(
    ([path]) => path === "/api/interview/recording",
  );
  expect(uploads).toHaveLength(10);
  const lastUpload = uploads[9][1]?.body;
  if (!(lastUpload instanceof FormData)) throw new Error("녹음 폼 누락");
  expect(lastUpload.get("question_index")).toBe("9");
  unmount();
  expect(isInterviewActive()).toBe(false);
});
