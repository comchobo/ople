import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Interview } from "./interview";
import { Recorder } from "./recorder";

function setupMicrophone() {
  vi.useFakeTimers();
  const stopTrack = vi.fn(),
    submit = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }),
    },
  });
  let active!: FakeRecorder;
  class FakeRecorder {
    constructor() {
      active = this;
    }
    static isTypeSupported() {
      return true;
    }
    state = "inactive";
    mimeType = "audio/webm";
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    start() {
      this.state = "recording";
    }
    pause() {
      this.state = "paused";
    }
    resume() {
      this.state = "recording";
    }
    stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["audio"]) });
      this.onstop?.();
    }
  }
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  return { submit, stopTrack, active: () => active };
}

describe("음성 인터뷰", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("질문 생성 실패 시 같은 인터뷰로 재시도한다", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response('{"detail":"잠시 후 다시 시도"}', { status: 502 }),
      )
      .mockResolvedValueOnce(
        new Response('{"question":"어떤 삶을 원하나요?"}'),
      );
    const user = userEvent.setup();
    render(<Interview exit={vi.fn()} generated={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "인터뷰 시작" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "잠시 후 다시 시도",
    );
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(
      await screen.findByRole("heading", { name: "어떤 삶을 원하나요?" }),
    ).toBeVisible();
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual(
      JSON.parse(String(fetcher.mock.calls[1][1]?.body)),
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("마이크 권한 거부를 표시한다", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("마이크 권한 거부")),
      },
    });
    vi.stubGlobal("MediaRecorder", { isTypeSupported: () => true });
    render(<Recorder submit={vi.fn()} busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "녹음 시작" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "마이크 권한 거부",
    );
    vi.unstubAllGlobals();
  });
  it("녹음·일시정지·이어 녹음·제출 및 마이크 해제를 처리한다", async () => {
    const { submit, stopTrack } = setupMicrophone();
    const { unmount } = render(<Recorder submit={submit} busy={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "녹음 시작" }));
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    expect(screen.getByRole("button", { name: "답변 제출" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "녹음 계속" }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.click(screen.getByRole("button", { name: "일시정지" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "답변 제출" }));
    });
    expect(submit).toHaveBeenCalledWith(expect.any(Blob), 3);
    expect(stopTrack).toHaveBeenCalled();
    unmount();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("마지막 30초를 안내하고 녹음마다 제한 팝업을 한 번 열어 기존 경로로 제출한다", async () => {
    const { submit } = setupMicrophone();
    const confirm = vi
      .spyOn(window, "confirm")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const { rerender } = render(<Recorder submit={submit} busy={false} />);
    const button = (name: string) => screen.getByRole("button", { name });
    const tick = (seconds: number) =>
      act(() => vi.advanceTimersByTime(seconds * 1000));
    const start = async () => {
      await act(async () => {
        fireEvent.click(button("녹음 시작"));
      });
    };
    await start();
    tick(149);
    expect(screen.getByRole("timer")).toHaveTextContent("02:29");
    expect(screen.queryByText(/초 남음/)).toBeNull();
    tick(1);
    expect(screen.getByText("30초 남음")).toBeVisible();
    expect(screen.getByRole("timer")).toHaveClass("motion-safe:animate-pulse");
    tick(17);
    fireEvent.click(button("일시정지"));
    tick(10);
    expect(screen.getByRole("timer")).toHaveTextContent("02:47");
    expect(screen.getByText("13초 남음")).toBeVisible();
    expect(screen.getByRole("timer")).not.toHaveClass(
      "motion-safe:animate-pulse",
    );
    expect(button("답변 제출")).toBeEnabled();
    fireEvent.click(button("녹음 계속"));
    tick(12);
    expect(screen.getByText("1초 남음")).toBeVisible();
    expect(screen.getByRole("timer")).toHaveClass("motion-safe:animate-pulse");
    tick(1);
    let dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "다시 녹음" }));
    expect(dialog).toBeVisible();
    fireEvent.keyDown(dialog, { key: "Escape" });
    rerender(<Recorder submit={submit} busy={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(button("다시 녹음")).toHaveFocus();
    expect(button("녹음 계속")).toBeDisabled();
    expect(screen.getByRole("timer")).toHaveTextContent("03:00");
    expect(screen.getByText("3분 제한으로 녹음이 멈췄어요.")).toBeVisible();
    fireEvent.click(button("다시 녹음"));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.queryByText(/3분 제한으로/)).toBeNull();
    await start();
    tick(180);
    dialog = screen.getByRole("dialog");
    expect(submit).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "답변 제출" }));
    expect(submit).toHaveBeenCalledExactlyOnceWith(expect.any(Blob), 180);
    expect(await submit.mock.calls[0][0].text()).toBe("audio");
  });

  it("제한 직후에 용량 초과 데이터가 도착하면 팝업에서 재녹음할 수 있다", async () => {
    const { submit, active } = setupMicrophone();
    render(<Recorder submit={submit} busy={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "녹음 시작" }));
    });
    act(() => vi.advanceTimersByTime(180000));
    const dialog = within(screen.getByRole("dialog"));
    const data = new Blob(["audio"]);
    Object.defineProperty(data, "size", { value: 20 * 1024 * 1024 + 1 });
    act(() => active().ondataavailable?.({ data }));
    expect(dialog.getByRole("alert")).toHaveTextContent("20MB를 초과했습니다.");
    expect(dialog.queryByRole("button", { name: "답변 제출" })).toBeNull();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(dialog.getByRole("button", { name: "다시 녹음" }));
    expect(screen.getByRole("button", { name: "녹음 시작" })).toBeEnabled();
    expect(submit).not.toHaveBeenCalled();
  });
});
