import { describe, expect, it } from "vitest";
import { changeRange, monthLabel, wav } from "./product";

describe("timeline month boundaries", () => {
  it("moves a complete piece without shortening it", () => {
    expect(changeRange(2, 5, -20, "move")).toEqual({
      start_month: 1,
      duration: 5,
    });
    expect(changeRange(2, 5, 100, "move")).toEqual({
      start_month: 56,
      duration: 5,
    });
  });
  it("clamps handles to one month and the full sixty month axis", () => {
    expect(changeRange(4, 5, 10, "start")).toEqual({
      start_month: 8,
      duration: 1,
    });
    expect(changeRange(4, 5, -10, "end")).toEqual({
      start_month: 4,
      duration: 1,
    });
    expect(changeRange(4, 5, 100, "end")).toEqual({
      start_month: 4,
      duration: 57,
    });
  });
  it("does not change a frozen axis at a new calendar year", () => {
    expect(monthLabel("2026-11", 3)).toBe("2027.01");
    expect(monthLabel("2026-11", 60)).toBe("2031.10");
  });
});

it("encodes actual signed PCM samples with a valid WAV header", async () => {
  const result = wav([new Float32Array([-1, 0, 1])], 16000);
  const bytes = new DataView(await result.arrayBuffer());
  expect(result.type).toBe("audio/wav");
  expect(bytes.getUint32(24, true)).toBe(16000);
  expect(bytes.getUint32(40, true)).toBe(6);
  expect(bytes.getInt16(44, true)).toBe(-32768);
  expect(bytes.getInt16(48, true)).toBe(32767);
});

it("keeps high sample-rate microphone recordings within the five-minute upload budget", async () => {
  const result = wav([new Float32Array(48000).fill(0.5)], 48000);
  const view = new DataView(await result.arrayBuffer());
  expect(view.getUint32(24, true)).toBe(16000);
  expect(view.getUint32(40, true)).toBe(32000);
});
