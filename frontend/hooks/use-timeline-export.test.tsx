import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Piece } from "@/api/core";
import { useTimelineExport } from "./use-timeline-export";

const piece: Piece = {
  id: "p",
  title: "작은 실험",
  description: "",
  category: "work",
  start: 12,
  duration: 6,
};
beforeEach(() => {
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve() },
  });
});
afterEach(() => {
  Reflect.deleteProperty(document, "fonts");
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function canvasContext() {
  const context = {
    scale: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    restore: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  return context;
}

it("월 위치를 PNG에 반영하고 파일명을 정리해 다운로드한 뒤 URL을 해제한다", async () => {
  vi.useFakeTimers();
  const context = canvasContext();
  const blob = new Blob(["png"], { type: "image/png" });
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((done) =>
    done(blob),
  );
  const createObjectURL = vi.fn(() => "blob:timeline");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    },
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  let ready!: () => void;
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        ready = resolve;
      }),
    },
  });
  const { result } = renderHook(() => useTimelineExport());
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.download([piece], "계획/A:B");
  });
  expect(result.current.exporting).toBe(true);
  await act(async () => {
    ready();
    await pending;
  });
  expect(result.current.exporting).toBe(false);
  expect(result.current.error).toBe("");
  expect(context.fillRect).toHaveBeenCalledWith(240, 43, 120, 44);
  expect(context.fillText).toHaveBeenCalledWith("작은 실험", 246, 58);
  expect(createObjectURL).toHaveBeenCalledWith(blob);
  const anchor = click.mock.instances[0] as HTMLAnchorElement;
  expect(anchor.download).toBe("계획_A_B.png");
  expect(anchor.href).toBe("blob:timeline");
  expect(revokeObjectURL).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(10000);
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:timeline");
});

it("Canvas 인코딩 실패를 오류 상태로 제공하고 다운로드하지 않는다", async () => {
  canvasContext();
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((done) =>
    done(null),
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  const { result } = renderHook(() => useTimelineExport());
  await act(async () => {
    await result.current.download([piece], "계획");
  });
  expect(result.current.error).toBe("이미지 생성에 실패했습니다.");
  expect(result.current.exporting).toBe(false);
  expect(click).not.toHaveBeenCalled();
});

it("안전한 이미지 크기를 초과하면 Canvas를 생성하지 않는다", async () => {
  const { result } = renderHook(() => useTimelineExport());
  const create = vi.spyOn(document, "createElement");
  await act(async () => {
    await result.current.download(
      Array.from({ length: 250 }, () => piece),
      "계획",
    );
  });
  expect(result.current.error).toBe(
    "타임라인이 너무 커서 이미지로 저장할 수 없습니다.",
  );
  expect(result.current.exporting).toBe(false);
  expect(create).not.toHaveBeenCalledWith("canvas");
});
