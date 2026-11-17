import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Interview, Recorder } from "./interview";

describe("음성 인터뷰", () => {
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
    class FakeRecorder {
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
});
