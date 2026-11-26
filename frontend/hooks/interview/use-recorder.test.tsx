import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useRecorder } from "./use-recorder";

class FakeRecorder {
  static current: FakeRecorder;
  static isTypeSupported() {
    return true;
  }
  state = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() {
    FakeRecorder.current = this;
  }
  start() {
    this.state = "recording";
  }
  pause = vi.fn(() => {
    this.state = "paused";
  });
  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function microphone(getUserMedia: () => Promise<unknown>) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  vi.stubGlobal("MediaRecorder", FakeRecorder);
}

it("3분 제한에서 자동으로 일시정지하고 언마운트 시 마이크를 해제한다", async () => {
  vi.useFakeTimers();
  const stop = vi.fn();
  microphone(async () => ({ getTracks: () => [{ stop }] }));
  const { result, unmount } = renderHook(() => useRecorder(vi.fn()));
  await act(async () => {
    await result.current.start();
  });
  act(() => {
    vi.advanceTimersByTime(180000);
  });
  expect(result.current.state).toBe("paused");
  expect(result.current.seconds).toBe(180);
  expect(FakeRecorder.current.pause).toHaveBeenCalledOnce();
  act(() => {
    result.current.resume();
    vi.advanceTimersByTime(5000);
  });
  expect(result.current.seconds).toBe(180);
  expect(result.current.state).toBe("paused");
  unmount();
  expect(stop).toHaveBeenCalled();
});

it("20MB를 넘는 녹음은 자동 일시정지하고 제출하지 않는다", async () => {
  microphone(async () => ({ getTracks: () => [{ stop: vi.fn() }] }));
  const submit = vi.fn();
  const { result } = renderHook(() => useRecorder(submit));
  await act(async () => {
    await result.current.start();
  });
  const data = new Blob(["audio"]);
  Object.defineProperty(data, "size", { value: 20 * 1024 * 1024 + 1 });
  act(() => {
    FakeRecorder.current.ondataavailable?.({ data });
  });
  expect(result.current.state).toBe("paused");
  expect(result.current.oversized).toBe(true);
  expect(result.current.error).toBe("20MB를 초과했습니다. 다시 녹음해주세요.");
  expect(submit).not.toHaveBeenCalled();
});

it("마이크 권한 응답 전에 화면을 떠나면 늦게 열린 트랙을 즉시 해제한다", async () => {
  const stop = vi.fn();
  let grant!: (stream: unknown) => void;
  microphone(
    () =>
      new Promise((resolve) => {
        grant = resolve;
      }),
  );
  const { result, unmount } = renderHook(() => useRecorder(vi.fn()));
  let starting!: Promise<void>;
  act(() => {
    starting = result.current.start();
  });
  unmount();
  await act(async () => {
    grant({ getTracks: () => [{ stop }] });
    await starting;
  });
  expect(stop).toHaveBeenCalledOnce();
});
