import { describe, expect, it } from "vitest";
import type { Piece } from "@/api/core";
import { adjustPiece } from "./adjust-piece";

const piece: Piece = {
  id: "p",
  title: "활동",
  description: "설명",
  category: "creative",
  start: 12,
  duration: 6,
};

describe("5년 타임라인의 월 단위 편집", () => {
  it.each([
    ["move", -30, 0, 6],
    ["move", 100, 54, 6],
    ["start", -30, 0, 18],
    ["start", 100, 17, 1],
    ["end", -30, 12, 1],
    ["end", 100, 12, 48],
  ] as const)(
    "%s 조절에서 경계와 최소 1개월을 지킨다 (%s)",
    (mode, delta, start, duration) => {
      const result = adjustPiece(piece, mode, delta);
      expect(result).toEqual({ ...piece, start, duration });
      expect(piece.start).toBe(12);
      expect(piece.duration).toBe(6);
    },
  );
});
