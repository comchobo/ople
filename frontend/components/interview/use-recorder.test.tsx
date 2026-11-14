import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useRecorder } from "./use-recorder";

let recorder: ReturnType<typeof useRecorder>;
let renderer: ReactTestRenderer;
let processAudio:
  | ((event: { inputBuffer: { getChannelData: () => Float32Array } }) => void)
  | null;
const stopped = vi.fn();
const closed = vi.fn();
let ended: (() => void) | null;

function Harness() {
  recorder = useRecorder(2);
  return null;
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [
          {
            stop: stopped,
            set onended(handler: () => void) {
              ended = handler;
            },
          },
        ],
      }),
    },
  });
  vi.stubGlobal(
    "AudioContext",
    class {
      sampleRate = 4;
      async resume() {}
      async close() {
        closed();
      }
      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }
      createScriptProcessor() {
        return {
          set onaudioprocess(callback: typeof processAudio) {
            processAudio = callback;
          },
          connect() {},
          disconnect() {},
        };
      }
    },
  );
  stopped.mockClear();
  closed.mockClear();
  processAudio = null;
  ended = null;
});

afterEach(async () => {
  await act(async () => {
    renderer?.unmount();
  });
  vi.unstubAllGlobals();
});

it("pauses without collecting samples, resumes one answer and caps at the audio limit", async () => {
  await act(async () => {
    renderer = create(<Harness />);
  });
  await act(async () => {
    await recorder.start();
  });
  const frame = () =>
    processAudio?.({
      inputBuffer: {
        getChannelData: () => new Float32Array([0.1, 0.2, 0.3, 0.4]),
      },
    });
  await act(async () => {
    frame();
  });
  expect(recorder.seconds).toBe(1);
  await act(async () => {
    recorder.pause();
    frame();
  });
  expect(recorder.seconds).toBe(1);
  await act(async () => {
    await recorder.start();
    frame();
    frame();
  });
  expect(recorder.seconds).toBe(2);
  expect(recorder.state).toBe("paused");
  expect(recorder.recording()?.size).toBe(44 + 8 * 2);
  await act(async () => {
    recorder.reset();
  });
  expect(recorder.recording()).toBeNull();
  expect(stopped).toHaveBeenCalled();
  expect(closed).toHaveBeenCalled();
});

it("shows permission failure without producing an answer", async () => {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
    new DOMException("denied", "NotAllowedError"),
  );
  await act(async () => {
    renderer = create(<Harness />);
  });
  await act(async () => {
    await recorder.start();
  });
  expect(recorder.error).toContain("권한");
  expect(recorder.state).toBe("idle");
  expect(recorder.recording()).toBeNull();
});

it("does not pretend an ended microphone can resume, and retains the recorded audio", async () => {
  await act(async () => {
    renderer = create(<Harness />);
  });
  await act(async () => {
    await recorder.start();
  });
  await act(async () => {
    processAudio?.({
      inputBuffer: { getChannelData: () => new Float32Array([0.1, 0.2]) },
    });
    ended?.();
  });
  const captured = recorder.recording()?.size;
  expect(captured).toBeGreaterThan(44);
  await act(async () => {
    await recorder.start();
  });
  expect(recorder.state).toBe("paused");
  expect(recorder.error).toContain("끊겼");
  expect(recorder.recording()?.size).toBe(captured);
});

it("releases a microphone granted after the screen has unmounted", async () => {
  let grant!: (stream: MediaStream) => void;
  vi.mocked(navigator.mediaDevices.getUserMedia).mockReturnValue(
    new Promise((resolve) => {
      grant = resolve;
    }),
  );
  await act(async () => {
    renderer = create(<Harness />);
  });
  let pending!: Promise<void>;
  await act(async () => {
    pending = recorder.start();
  });
  await act(async () => {
    renderer.unmount();
  });
  await act(async () => {
    grant({ getTracks: () => [{ stop: stopped }] } as unknown as MediaStream);
    await pending;
  });
  expect(stopped).toHaveBeenCalledOnce();
});
