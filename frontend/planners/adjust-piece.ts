import type { Piece } from "@/api/core";

export type Adjustment = "move" | "start" | "end";
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function adjustPiece(
  piece: Piece,
  mode: Adjustment,
  delta: number,
): Piece {
  if (mode === "move")
    return {
      ...piece,
      start: clamp(piece.start + delta, 0, 60 - piece.duration),
    };
  if (mode === "start") {
    const start = clamp(
      piece.start + delta,
      0,
      piece.start + piece.duration - 1,
    );
    return { ...piece, start, duration: piece.start + piece.duration - start };
  }
  return {
    ...piece,
    duration: clamp(piece.duration + delta, 1, 60 - piece.start),
  };
}
