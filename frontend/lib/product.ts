export type Piece = {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  category: string;
  start_month: number;
  duration: number;
};
export type Plan = {
  id: string;
  kind: string;
  title: string;
  description: string;
  pieces: Piece[];
  scores: number[] | null;
};
export type Planner = {
  id: string;
  name: string;
  created_at: string;
  start_month: string;
  plans: Plan[];
};
export type Interview = {
  id: string;
  status: string;
  question: string;
  position: number;
  answered: number;
  summary: string;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function changeRange(
  start: number,
  duration: number,
  delta: number,
  mode: string,
) {
  const end = start + duration - 1;
  if (mode === "start") {
    const next = clamp(start + delta, 1, end);
    return { start_month: next, duration: end - next + 1 };
  }
  if (mode === "end")
    return {
      start_month: start,
      duration: clamp(end + delta, start, 60) - start + 1,
    };
  return { start_month: clamp(start + delta, 1, 61 - duration), duration };
}

export function monthLabel(start: string, month: number) {
  const [year, index] = start.split("-").map(Number);
  const date = new Date(Date.UTC(year, index + month - 2, 1));
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function createdLabel(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function wav(chunks: Float32Array[], sampleRate: number): Blob {
  const targetRate = Math.min(sampleRate, 16000);
  const ratio = sampleRate / targetRate;
  const size = Math.floor(
    chunks.reduce((sum, chunk) => sum + chunk.length, 0) / ratio,
  );
  const buffer = new ArrayBuffer(44 + size * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++)
      view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + size * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, size * 2, true);
  let position = 44;
  let consumed = 0;
  let count = 0;
  let sum = 0;
  for (const chunk of chunks)
    for (const sample of chunk) {
      consumed += 1;
      count += 1;
      sum += sample;
      if (
        consumed >= Math.ceil(((position - 44) / 2 + 1) * ratio) &&
        position < buffer.byteLength
      ) {
        const value = clamp(sum / count, -1, 1);
        view.setInt16(
          position,
          value < 0 ? value * 32768 : value * 32767,
          true,
        );
        position += 2;
        count = 0;
        sum = 0;
      }
    }
  return new Blob([buffer], { type: "audio/wav" });
}
