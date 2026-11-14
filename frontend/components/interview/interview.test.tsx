import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api } from "../../lib/api";
import { InterviewScreen } from "./interview";

const recorder = vi.hoisted(() => ({
  state: "paused",
  seconds: 1,
  error: "",
  reset: vi.fn(),
  release: vi.fn(),
  recording: vi.fn(),
  start: vi.fn(),
  pause: vi.fn(),
}));
vi.mock("./use-recorder", () => ({ useRecorder: () => recorder }));
vi.mock("../../lib/api", () => ({ api: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
let renderer: ReactTestRenderer;
const initial = {
  id: "session",
  status: "active",
  question: "현재 질문",
  position: 0,
  answered: 0,
  summary: "",
};

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  recorder.reset.mockClear();
  recorder.recording.mockReturnValue(
    new Blob(["audio"], { type: "audio/wav" }),
  );
  vi.mocked(api)
    .mockReset()
    .mockResolvedValueOnce({ recording_max_seconds: 300 })
    .mockResolvedValueOnce(initial);
  await act(async () => {
    renderer = create(<InterviewScreen id="session" />, {
      createNodeMock: (node) =>
        node.type === "dialog"
          ? {
              open: false,
              showModal() {
                this.open = true;
              },
              close() {
                this.open = false;
              },
            }
          : null,
    });
  });
});
afterEach(async () => {
  await act(async () => {
    renderer.unmount();
  });
  vi.unstubAllGlobals();
});

const send = () =>
  renderer.root
    .findAllByType("button")
    .find((node) => node.props["aria-label"] === "답변 제출");

it("reconciles a lost successful response rather than repeatedly resending to an old question", async () => {
  vi.mocked(api)
    .mockRejectedValueOnce(new Error("응답 유실"))
    .mockResolvedValueOnce({
      ...initial,
      question: "다음 질문",
      position: 1,
      answered: 1,
    });
  await act(async () => {
    await send()?.props.onClick();
  });
  expect(api).toHaveBeenLastCalledWith("/interviews/session");
  expect(recorder.reset).toHaveBeenCalledOnce();
  expect(
    renderer.root
      .findAllByType("h1")
      .some((node) => node.children.join("") === "다음 질문"),
  ).toBe(true);
});

it("preserves the recording when the server has not advanced after a processing failure", async () => {
  vi.mocked(api)
    .mockRejectedValueOnce(new Error("처리 실패"))
    .mockResolvedValueOnce(initial);
  await act(async () => {
    await send()?.props.onClick();
  });
  expect(recorder.reset).not.toHaveBeenCalled();
  expect(
    renderer.root
      .findAllByProps({ role: "alert" })
      .some((node) => node.children.join("").includes("처리 실패")),
  ).toBe(true);
});

it("confirms rerecording in a modal and preserves audio when cancelled", async () => {
  const rerecord = renderer.root
    .findAllByType("button")
    .find((node) => node.props["aria-label"] === "다시 녹음");
  await act(async () => {
    rerecord?.props.onClick();
  });
  const dialog = renderer.root.findByType("dialog");
  expect(recorder.reset).not.toHaveBeenCalled();
  await act(async () => {
    dialog.props.onCancel({ preventDefault() {} });
  });
  expect(recorder.reset).not.toHaveBeenCalled();
  expect(api).toHaveBeenCalledTimes(2);
});
