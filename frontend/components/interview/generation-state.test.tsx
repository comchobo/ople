import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Interview } from "./interview";

vi.mock("./recorder", () => ({
  Recorder: ({
    submit,
    busy,
  }: {
    submit: (audio: Blob, duration: number) => Promise<void>;
    busy: boolean;
  }) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => void submit(new Blob(["audio"]), 1)}
    >
      답변 제출
    </button>
  ),
}));

it("생성 실패를 진행 상태와 구분하고 같은 작업 재시도 시 진행 안내로 돌아간다", async () => {
  let attempts = 0;
  let finish = (_response: Response) => {};
  const json = (value: unknown) => new Response(JSON.stringify(value));
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (path) => {
      if (path === "/api/interview/question")
        return json({ question: "어떤 삶을 원하나요?" });
      if (path === "/api/interview/recording")
        return json({ recording_id: "r", text: "나만의 일상" });
      if (path === "/api/interview/summary")
        return json({ summary: "나만의 일상을 지키고 싶어요." });
      if (String(path).endsWith("/run")) {
        if (++attempts === 1)
          return new Response(
            JSON.stringify({ detail: "생성 서버에 연결하지 못했어요." }),
            { status: 503 },
          );
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      }
      return json({ status: "pending" });
    });
  const generated = vi.fn();
  const user = userEvent.setup();
  render(<Interview exit={vi.fn()} generated={generated} />);
  await user.click(screen.getByRole("button", { name: "인터뷰 시작" }));
  for (let i = 0; i < 10; i++) {
    await user.click(await screen.findByRole("button", { name: "답변 제출" }));
  }
  await user.click(
    await screen.findByRole("button", { name: "플래너 생성하기" }),
  );
  expect(
    await screen.findByRole("heading", {
      name: "플래너 생성을 완료하지 못했어요",
    }),
  ).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "생성 서버에 연결하지 못했어요.",
  );
  expect(
    screen.queryByText(
      "화면을 떠나도 생성 결과는 내 플래너 목록에서 확인할 수 있습니다.",
    ),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(
    screen.getByRole("heading", { name: "세 가지 미래를 그리고 있어요" }),
  ).toBeVisible();
  await waitFor(() => expect(attempts).toBe(2));
  const runs = fetcher.mock.calls
    .map(([path]) => String(path))
    .filter((path) => path.endsWith("/run"));
  expect(runs[0]).toBe(runs[1]);
  await act(async () =>
    finish(
      json({
        id: "job",
        status: "completed",
        planner_id: "planner",
        error: null,
      }),
    ),
  );
  await waitFor(() =>
    expect(generated).toHaveBeenCalledWith(
      expect.objectContaining({ planner_id: "planner" }),
    ),
  );
});
