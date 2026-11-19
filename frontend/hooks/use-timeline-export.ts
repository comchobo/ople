"use client";

import { useState } from "react";
import type { Piece } from "@/api/core";

export function useTimelineExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  async function download(pieces: Piece[], filename: string) {
    setExporting(true);
    setError("");
    try {
      await exportTimeline(pieces, filename);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setExporting(false);
    }
  }
  return { exporting, error, download };
}

async function exportTimeline(pieces: Piece[], filename: string) {
  await document.fonts.ready;
  const scale = 2,
    width = 1200,
    height = 38 + Math.max(1, pieces.length) * 54;
  if (height * width * scale * scale > 64_000_000)
    throw new Error("타임라인이 너무 커서 이미지로 저장할 수 없습니다.");
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 생성할 수 없습니다.");
  context.scale(scale, scale);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
  context.font = "12px sans-serif";
  context.textBaseline = "middle";
  for (let year = 0; year < 5; year++) {
    context.strokeStyle = "#ddd";
    context.beginPath();
    context.moveTo((year * width) / 5, 0);
    context.lineTo((year * width) / 5, height);
    context.stroke();
    context.fillStyle = "#555";
    context.fillText(`${year + 1}년차`, (year * width) / 5 + 8, 19);
  }
  pieces.forEach((piece, index) => {
    const y = 38 + index * 54,
      left = (piece.start / 60) * width,
      span = (piece.duration / 60) * width;
    context.strokeStyle = "#e5e5e5";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
    context.fillStyle = "#ececec";
    context.fillRect(left, y + 5, span, 44);
    context.strokeStyle = "#999";
    context.strokeRect(left + 0.5, y + 5.5, span - 1, 43);
    context.save();
    context.beginPath();
    context.rect(left + 4, y + 6, Math.max(0, span - 8), 42);
    context.clip();
    context.fillStyle = "#222";
    context.font = "12px sans-serif";
    context.fillText(piece.title, left + 6, y + 20);
    context.font = "10px sans-serif";
    context.fillText(
      `${piece.start + 1}개월차부터 · ${piece.duration}개월`,
      left + 6,
      y + 36,
    );
    context.restore();
  });
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("이미지 생성에 실패했습니다.")),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename.replace(/[\\/:*?"<>|]/g, "_")}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
