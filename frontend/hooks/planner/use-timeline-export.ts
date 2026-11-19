"use client";

import { useState } from "react";
import type { Piece } from "@/api/core";

export function useTimelineExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  async function download(pieces: Piece[], filename: string, color?: string) {
    setExporting(true);
    setError("");
    try {
      await exportTimeline(pieces, filename, color);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setExporting(false);
    }
  }
  return { exporting, error, download };
}

async function exportTimeline(
  pieces: Piece[],
  filename: string,
  color?: string,
) {
  await document.fonts.ready;
  const tokens = getComputedStyle(document.documentElement);
  const ink = tokens.getPropertyValue("--ink").trim() || "#312c42";
  const paper = tokens.getPropertyValue("--paper").trim() || "#faf8f2";
  const line = tokens.getPropertyValue("--line").trim() || "#d8d3ca";
  const planColor =
    color || tokens.getPropertyValue("--plan-a").trim() || "#e2ed99";
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const scale = 2,
    width = 1200,
    heading = 96,
    years = 42,
    row = 66,
    height = heading + years + Math.max(1, pieces.length) * row;
  if (height * width * scale * scale > 64_000_000)
    throw new Error("타임라인이 너무 커서 이미지로 저장할 수 없습니다.");
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 생성할 수 없습니다.");
  context.scale(scale, scale);
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);
  context.fillStyle = ink;
  context.textBaseline = "middle";
  context.font = `600 26px ${font}`;
  context.fillText(filename, 24, 32, width - 48);
  context.font = `13px ${font}`;
  context.fillText("Ople · 5년의 타임라인", 24, 66);
  context.fillStyle = planColor;
  context.fillRect(0, heading, width, years);
  context.font = `12px ${font}`;
  for (let year = 0; year < 5; year++) {
    context.strokeStyle = line;
    context.beginPath();
    context.moveTo((year * width) / 5, heading);
    context.lineTo((year * width) / 5, height);
    context.stroke();
    context.fillStyle = ink;
    context.fillText(
      `${year + 1}년차`,
      (year * width) / 5 + 8,
      heading + years / 2,
    );
  }
  if (!pieces.length) {
    context.fillStyle = ink;
    context.fillText("아직 활동이 없어요.", 24, heading + years + row / 2);
  }
  pieces.forEach((piece, index) => {
    const y = heading + years + index * row,
      left = (piece.start / 60) * width,
      span = (piece.duration / 60) * width;
    context.strokeStyle = line;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
    context.fillStyle = planColor;
    context.fillRect(left, y + 8, span, 50);
    context.strokeStyle = "#aaa08a";
    context.strokeRect(left + 0.5, y + 8.5, span - 1, 49);
    context.save();
    context.beginPath();
    context.rect(left + 4, y + 9, Math.max(0, span - 8), 48);
    context.clip();
    context.fillStyle = ink;
    context.font = `12px ${font}`;
    context.fillText(piece.title, left + 9, y + 25);
    context.font = `10px ${font}`;
    context.fillText(
      `${piece.start + 1}개월차부터 · ${piece.duration}개월`,
      left + 9,
      y + 43,
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
