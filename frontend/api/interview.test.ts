import { expect, it, vi } from "vitest";
import type { Answer } from "./core";
import {
  createGeneration,
  listGenerations,
  runGeneration,
} from "./generations";
import { getQuestion, getSummary, uploadRecording } from "./interview";

it("질문·요약 요청에 동일한 인터뷰와 답변을 전달한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response('{"question":"다음 질문"}'))
    .mockResolvedValueOnce(new Response('{"summary":"나의 이야기"}'));
  const answers: Answer[] = [
    { question: "질문", answer: "답변", recording_id: "r" },
  ];
  expect(await getQuestion("i", answers)).toEqual({ question: "다음 질문" });
  expect(await getSummary("i", answers)).toEqual({ summary: "나의 이야기" });
  for (const [index, path] of ["question", "summary"].entries()) {
    expect(fetcher.mock.calls[index]).toEqual([
      `/api/interview/${path}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ interview_id: "i", answers }),
      }),
    ]);
  }
});

it("녹음 파일과 메타데이터를 multipart로 보내고 전사 결과를 반환한다", async () => {
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response('{"recording_id":"r","text":"전사 결과"}'));
  const audio = new Blob(["voice"], { type: "audio/webm" });
  expect(await uploadRecording("i", 2, audio, 3.5)).toEqual({
    recording_id: "r",
    text: "전사 결과",
  });
  const [path, request] = fetcher.mock.calls[0];
  expect(path).toBe("/api/interview/recording");
  expect(request).toMatchObject({ method: "POST", credentials: "same-origin" });
  expect(request?.headers).toBeUndefined();
  const form = request?.body as FormData;
  expect(form.get("interview_id")).toBe("i");
  expect(form.get("question_index")).toBe("2");
  expect(form.get("duration")).toBe("3.5");
  const file = form.get("audio") as File;
  expect(file.name).toBe("recording");
  expect(file.type).toBe("audio/webm");
  expect(file.size).toBe(audio.size);
});

it("생성 작업을 등록한 ID로 실행하고 목록을 읽는다", async () => {
  const job = { id: "j", status: "pending", planner_id: null, error: null };
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(job)))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ ...job, status: "running" })),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify([job])));
  expect(await createGeneration("j", "i", [], "요약")).toEqual(job);
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/generations/j",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ interview_id: "i", answers: [], summary: "요약" }),
    }),
  );
  expect(await runGeneration("j")).toMatchObject({
    id: "j",
    status: "running",
  });
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/generations/j/run",
    expect.objectContaining({ method: "POST", body: "{}" }),
  );
  expect(await listGenerations()).toEqual([job]);
  expect(fetcher).toHaveBeenLastCalledWith(
    "/api/generations",
    expect.objectContaining({ method: "GET" }),
  );
});
