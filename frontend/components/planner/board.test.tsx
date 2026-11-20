import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Planner } from "@/api/core";
import { Board } from "./board";
import { PieceEditor } from "./piece-editor";
import { RatingEditor, RatingSummary } from "./rating-editor";

const planner: Planner = {
  id: "p",
  name: "나의 계획",
  created_at: "2026-11-17T00:00:00",
  plans: [
    "현재 방향을 발전시키는 계획",
    "다른 방향을 탐색하는 계획",
    "원하는 삶에서 출발하는 계획",
  ].map((kind, i) => ({
    kind,
    title: `플랜 ${i}`,
    description: "설명",
    scores: {},
    pieces: [
      {
        id: `piece${i}`,
        title: "작은 실험",
        description: "주말에 시도",
        category: "creative",
        start: 0,
        duration: 6,
      },
    ],
  })),
};

describe("플래너 편집", () => {
  it("평가 요약은 0점과 미평가를 구분해 표시한다", () => {
    const { container } = render(
      <RatingSummary scores={{ resources: 0, appeal: 8 }} />,
    );
    const values = container.querySelectorAll("[data-score]");
    expect(values[0]).toHaveTextContent("자원 0");
    expect(values[0].querySelector("span")).toHaveStyle({
      width: "0%",
    });
    expect(values[1]).toHaveTextContent("호감 8");
    expect(values[1].querySelector("span")).toHaveStyle({
      width: "80%",
    });
    expect(values[2]).toHaveTextContent("자신감 미평가");
    expect(values[3]).toHaveTextContent("일관성 미평가");
  });
  it("PNG 생성 실패를 보드에 표시하고 다시 저장할 수 있게 한다", async () => {
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: Promise.resolve() },
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    try {
      render(
        <Board
          planner={planner}
          change={vi.fn()}
          list={vi.fn()}
          create={vi.fn()}
        />,
      );
      const user = userEvent.setup();
      await user.click(
        screen.getByRole("button", { name: "타임라인 PNG 저장" }),
      );
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "이미지를 생성할 수 없습니다.",
      );
      expect(
        screen.getByRole("button", { name: "타임라인 PNG 저장" }),
      ).toBeEnabled();
    } finally {
      Reflect.deleteProperty(document, "fonts");
    }
  });
  it("플랜 전환과 활동 추가를 현재 플랜에 반영한다", async () => {
    const change = vi.fn(),
      user = userEvent.setup();
    render(
      <Board
        planner={planner}
        change={change}
        list={vi.fn()}
        create={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("tab", { name: /B ·/ }));
    expect(screen.getByRole("heading", { name: "플랜 1" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "+ 활동 추가" }));
    await user.type(screen.getByLabelText("활동 제목"), "새로운 도전");
    await user.click(screen.getByRole("button", { name: "저장" }));
    const updated = change.mock.calls[0][0] as Planner;
    expect(updated.plans[0]).toEqual(planner.plans[0]);
    expect(updated.plans[1].pieces).toHaveLength(2);
    expect(updated.plans[1].pieces[1].title).toBe("새로운 도전");
    expect(screen.queryByText("저장됨")).not.toBeInTheDocument();
  });
  it("활동 시작을 옮기면 기간이 60개월을 넘지 않도록 줄인다", async () => {
    const save = vi.fn(),
      user = userEvent.setup();
    render(
      <PieceEditor
        piece={planner.plans[0].pieces[0]}
        save={save}
        close={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("시작 월"), {
      target: { value: "59" },
    });
    expect(screen.getByLabelText("기간 (개월)")).toHaveValue(2);
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ start: 58, duration: 2 }),
    );
  });
  it("활동 삭제 확인과 복제를 지원한다", async () => {
    const change = vi.fn(),
      user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <Board
        planner={planner}
        change={change}
        list={vi.fn()}
        create={vi.fn()}
      />,
    );
    function timelineButton(name: RegExp) {
      const track = document.getElementById("timeline-track");
      if (!track) throw new Error("timeline missing");
      return within(track).getByRole("button", { name });
    }
    await user.click(timelineButton(/작은 실험.*개월차부터/));
    await user.click(screen.getByRole("button", { name: "복제" }));
    expect(change.mock.calls[0][0].plans[0].pieces).toHaveLength(2);
    await user.click(timelineButton(/작은 실험.*개월차부터/));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(change.mock.calls[1][0].plans[0].pieces).toHaveLength(0);
  });
  it("자가평가는 직접 입력하며 초기화할 수 있다", async () => {
    const save = vi.fn(),
      user = userEvent.setup();
    render(
      <RatingEditor plan={planner.plans[0]} save={save} close={vi.fn()} />,
    );
    fireEvent.change(screen.getByRole("slider", { name: "자원 · 5" }), {
      target: { value: "8" },
    });
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(save).toHaveBeenCalledWith({
      resources: 8,
      appeal: 5,
      confidence: 5,
      coherence: 5,
    });
    await user.click(screen.getByRole("button", { name: "평가 초기화" }));
    expect(save).toHaveBeenLastCalledWith({});
  });
});
