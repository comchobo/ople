"use client";

import { useState } from "react";
import type { Category, Piece } from "@/api/core";

const categoryColors: Record<Category, { soft: string; edge: string }> = {
  work: { soft: "#dfe4ef", edge: "#2f4f8f" },
  creative: { soft: "#f0ded5", edge: "#b24e30" },
  relation: { soft: "#e4e7dc", edge: "#5c6b4f" },
  rest: { soft: "#efe6d7", edge: "#8a6a3f" },
};

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
  context.fillStyle = "#f3efe6";
  context.fillRect(0, 0, width, height);
  context.font = '12px "Pretendard Variable", Pretendard, sans-serif';
  context.textBaseline = "middle";
  for (let year = 0; year < 5; year++) {
    const x = (year * width) / 5;
    context.strokeStyle = "#d8d2c5";
    context.beginPath();
    context.moveTo(x, 38);
    context.lineTo(x, height);
    context.stroke();
    context.fillStyle = "#6b675d";
    context.fillText(`${year + 1}년차`, x + 10, 19);
  }
  context.strokeStyle = "#b8b1a2";
  context.beginPath();
  context.moveTo(0, 38);
  context.lineTo(width, 38);
  context.stroke();
  pieces.forEach((piece, index) => {
    const y = 38 + index * 54,
      left = (piece.start / 60) * width,
      span = (piece.duration / 60) * width;
    context.strokeStyle = "#e4ded2";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
    const colors = categoryColors[piece.category];
    context.fillStyle = colors.soft;
    context.fillRect(left, y + 6, span, 44);
    context.fillStyle = colors.edge;
    context.fillRect(left, y + 6, 3, 44);
    context.strokeStyle = "#b8b1a2";
    context.strokeRect(left + 0.5, y + 6.5, Math.max(0, span - 1), 43);
    context.save();
    context.beginPath();
    context.rect(left + 5, y + 7, Math.max(0, span - 10), 42);
    context.clip();
    context.fillStyle = "#1b1a17";
    context.font = '12px "Pretendard Variable", Pretendard, sans-serif';
    context.fillText(piece.title, left + 10, y + 21);
    context.fillStyle = "#454239";
    context.font = '10px "Pretendard Variable", Pretendard, sans-serif';
    context.fillText(
      `${piece.start + 1}개월차부터 · ${piece.duration}개월`,
      left + 10,
      y + 37,
    );
    context.restore();
  });
  context.strokeStyle = "#b8b1a2";
  context.strokeRect(0.5, 0.5, width - 1, height - 1);
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
