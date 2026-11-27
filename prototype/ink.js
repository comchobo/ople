// A compact, single-line Hangul alphabet. Each pen lift creates a separately
// addressable SVG path, including inside generated syllables.
const consonants = {
  ㄱ: ["M1 2 9 1.6 8.5 9"],
  ㄴ: ["M2 1 1.7 8.7 9.5 8"],
  ㄷ: ["M9 1.5 1.4 2 1 8.8 9.3 8"],
  ㄹ: ["M1 2 9 1 8.6 5 2 5.2 1.8 9 9.4 8.5"],
  ㅁ: ["M1 2 1 9", "M1 2 9 1.5 8.6 8.5 1 9"],
  ㅂ: ["M1 1 1.3 9 9 8.7 9 1", "M1 5 9 4.6"],
  ㅅ: ["M5 1.6Q5 5 1 9", "M4.4 5 9.5 8.5"],
  ㅇ: ["M5 1.8C-1 1 0 10 5.4 9S12 2 5 1.8Z"],
  ㅈ: ["M1 2 9 1.6", "M5.5 2Q5 5.8 1 9", "M5 5 9.3 8.7"],
  ㅊ: ["M4 0 6 1", "M1 3 9 2.5", "M5.6 3Q5 6 1 9", "M5 5.6 9.3 9"],
  ㅋ: ["M1 2 9 1.6 8.6 9", "M2 5.8 8.6 5.3"],
  ㅌ: ["M9 1.4 1.6 2 1.3 9 9.5 8.5", "M2 5.5 8.6 5"],
  ㅍ: ["M.8 2 9.6 1.6", "M3 2.3 3.5 8.3", "M7.7 2 7.3 8", "M.7 9 9.6 8.4"],
  ㅎ: ["M4 0 6 1", "M1.2 3.2 9.2 2.7", "M5 4.1C0 4 1 10 5 9.5S10.6 4 5 4.1Z"],
};
const vowels = {
  ㅏ: ["M4 .5 3.7 10", "M4 5.1 9 4.7"],
  ㅑ: ["M4 .5 3.7 10", "M4 3.5 9 3", "M4 6.3 9 6"],
  ㅓ: ["M.6 5.7 6.5 5", "M7 .5 6.5 10"],
  ㅕ: ["M1 3.6 6.7 3", "M1 6.5 6.7 6", "M7 .5 6.5 10"],
  ㅣ: ["M5 .3 4.6 10"],
  ㅡ: ["M.3 6 9.6 5.4"],
  ㅗ: ["M5 2 4.7 7", "M.3 7.5 9.7 7"],
  ㅛ: ["M3.5 2.6 3.3 7", "M7 2.2 6.8 7", "M.3 7.5 9.7 7"],
  ㅜ: ["M.3 3.5 9.7 3", "M5 3.7 4.8 9.8"],
  ㅠ: ["M.3 3.5 9.7 3", "M3.3 3.7 3 9.8", "M7.2 3.7 7 9.6"],
};
const pairs = {
  ㄲ: "ㄱㄱ",
  ㄳ: "ㄱㅅ",
  ㄵ: "ㄴㅈ",
  ㄶ: "ㄴㅎ",
  ㄺ: "ㄹㄱ",
  ㄻ: "ㄹㅁ",
  ㄼ: "ㄹㅂ",
  ㄽ: "ㄹㅅ",
  ㄾ: "ㄹㅌ",
  ㄿ: "ㄹㅍ",
  ㅀ: "ㄹㅎ",
  ㅄ: "ㅂㅅ",
  ㅃ: "ㅂㅂ",
  ㅆ: "ㅅㅅ",
  ㄸ: "ㄷㄷ",
  ㅉ: "ㅈㅈ",
  ㅐ: "ㅏㅣ",
  ㅔ: "ㅓㅣ",
  ㅒ: "ㅑㅣ",
  ㅖ: "ㅕㅣ",
};
const initial = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ",
  medial = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ",
  finals = " ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";
const compound = {
  ㅘ: "ㅗㅏ",
  ㅙ: "ㅗㅐ",
  ㅚ: "ㅗㅣ",
  ㅝ: "ㅜㅓ",
  ㅞ: "ㅜㅔ",
  ㅟ: "ㅜㅣ",
  ㅢ: "ㅡㅣ",
};
import { escape } from "./data.js";
export function inkLine(str, x, y, step, id) {
  let out = "",
    index = 0;
  function part(c, px, py, w, h) {
    if (pairs[c]) {
      [...pairs[c]].forEach((v, i) =>
        part(v, px + i * w * 0.49, py, w * 0.49, h),
      );
      return;
    }
    for (const d of consonants[c] || vowels[c] || [])
      out += `<path data-ink="${id}-${index++}" transform="translate(${px} ${py}) scale(${w / 10} ${h / 10})" d="${d}" vector-effect="non-scaling-stroke"/>`;
  }
  for (const ch of str) {
    const n = ch.charCodeAt(0) - 44032;
    if (n < 0 || n >= 11172) {
      if (ch.trim())
        out += `<text data-ink="${id}-${index++}" x="${x}" y="${y + step * 0.78}" font-size="${step}" fill="currentColor" stroke="none">${escape(ch)}</text>`;
      x += step * (ch === " " ? 0.46 : 0.68);
      continue;
    }
    const a = initial[Math.floor(n / 588)],
      b = medial[Math.floor(n / 28) % 21],
      c = finals[n % 28];
    const h = step * (c === " " ? 0.86 : 0.59),
      w = step * 0.89;
    if (compound[b]) {
      part(a, x, y, w * 0.6, h * 0.63);
      part(compound[b][0], x, y + h * 0.6, w * 0.65, h * 0.38);
      part(compound[b][1], x + w * 0.65, y, w * 0.35, h);
    } else if ("ㅗㅛㅜㅠㅡ".includes(b)) {
      part(a, x + w * 0.15, y, w * 0.67, h * 0.62);
      part(b, x, y + h * 0.63, w, h * 0.38);
    } else {
      part(a, x, y + h * 0.12, w * 0.57, h * 0.79);
      part(b, x + w * 0.59, y, w * 0.42, h);
    }
    if (c !== " ") part(c, x + w * 0.18, y + step * 0.6, w * 0.62, step * 0.32);
    x += step;
  }
  return out;
}
export function wrap(text, limit) {
  const lines = [];
  let line = "";
  const size = (s) =>
    [...s].reduce(
      (a, c) => a + (/\s/.test(c) ? 0.46 : c.charCodeAt(0) < 128 ? 0.68 : 1),
      0,
    );
  for (const word of text.split(/\s+/)) {
    if (size(line + (line ? " " : "") + word) > limit && line) {
      lines.push(line);
      line = "";
    }
    for (const c of (line ? " " : "") + word) {
      if (size(line + c) > limit) {
        lines.push(line);
        line = "";
      }
      line += c;
    }
  }
  if (line) lines.push(line);
  return lines;
}
