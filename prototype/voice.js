import { icon } from "./data.js";
const first =
  "요즘 하는 일과 일상을 떠올려 보세요. 앞으로도 계속하고 싶은 순간은 언제인가요?";
export function interview({ root, planner: p, save, leave, complete }) {
  let stream,
    rec,
    timer,
    utterance,
    dead = false,
    state = "ready",
    retry = "question",
    request;
  const synth = window.speechSynthesis;
  p.turns ??= [];
  p.question ??= first;
  root.innerHTML = `<section class="voice"><div class="voice-top"><span>음성 인터뷰</span><span id="count"></span></div><div class="voice-stage"><div class="orb" aria-hidden="true"><i></i><i></i><i></i></div><h1 id="phase" aria-live="polite"></h1><p id="hint"></p></div><div class="voice-actions"><button id="talk" class="voice-action"></button><button id="leave" class="voice-action">${icon("close")}<span>나가기</span></button></div></section>`;
  const $ = (s) => root.querySelector(s);
  const talk = $("#talk");
  function show(s, title, hint = "", label = "", glyph = "mic") {
    state = s;
    $(".voice").dataset.state = s;
    $("#count").textContent = `${Math.min(10, p.turns.length + 1)} / 10`;
    $("#phase").textContent = title;
    $("#hint").textContent = hint;
    talk.innerHTML = icon(glyph) + `<span>${label || "잠시만요"}</span>`;
    talk.disabled = !label;
  }
  function stopTracks() {
    clearTimeout(timer);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  function cleanup() {
    dead = true;
    request?.abort();
    synth?.cancel();
    if (rec?.state === "recording") rec.stop();
    stopTracks();
  }
  $("#leave").onclick = () => {
    cleanup();
    leave();
  };
  async function post(path, body, headers = {}) {
    request = new AbortController();
    const r = await fetch("/voice/" + path, {
      method: "POST",
      body,
      headers,
      signal: request.signal,
    });
    if (!r.ok) throw Error(String(r.status));
    return r.json();
  }
  async function advance() {
    retry = "next";
    show(
      "processing",
      p.turns.length === 10
        ? "세 플랜을 그리고 있어요"
        : "다음 질문을 준비하고 있어요",
    );
    try {
      const data = await post("next", JSON.stringify({ turns: p.turns }), {
        "Content-Type": "application/json",
      });
      if (dead) return;
      if (data.plans) {
        p.plans = data.plans;
        p.name = "나의 오디세이 플래너";
        delete p.turns;
        delete p.question;
        delete p.pending;
        save();
        cleanup();
        complete();
        return;
      }
      p.question = data.question;
      p.pending = false;
      save();
      speak();
    } catch {
      if (!dead)
        show(
          "error",
          "연결이 끊겼어요",
          "방금 답한 내용부터 이어갈 수 있어요.",
          "다시 연결",
          "sound",
        );
    }
  }
  async function record() {
    retry = "question";
    show("request", "마이크를 연결하고 있어요");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (dead) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = s;
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (t) => MediaRecorder.isTypeSupported(t),
      );
      rec = new MediaRecorder(s, type ? { mimeType: type } : undefined);
      let chunks = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data);
      };
      rec.onstop = async () => {
        stopTracks();
        if (dead) return;
        const audio = new Blob(chunks, { type: rec.mimeType });
        chunks = [];
        show("processing", "답변을 듣고 있어요");
        try {
          const { answer } = await post("transcribe", audio);
          if (dead) return;
          p.turns.push({ q: p.question, a: answer });
          p.pending = true;
          save();
          await advance();
        } catch {
          if (!dead)
            show(
              "error",
              "소리를 확인하지 못했어요",
              "같은 질문을 듣고 다시 답해 주세요.",
              "다시 듣기",
              "sound",
            );
        }
      };
      rec.start(500);
      show(
        "listening",
        "듣고 있어요",
        "답변을 마치면 아래 버튼을 눌러 주세요.",
        "답변 마치기",
        "stop",
      );
      timer = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 90000);
    } catch {
      stopTracks();
      if (!dead)
        show(
          "error",
          "마이크를 사용할 수 없어요",
          "브라우저의 마이크 권한을 확인해 주세요.",
          "다시 듣기",
          "sound",
        );
    }
  }
  async function speak() {
    retry = "question";
    if (!synth || !window.SpeechSynthesisUtterance) {
      show(
        "error",
        "질문을 들려줄 수 없어요",
        "한국어 음성 합성을 지원하는 브라우저에서 열어 주세요.",
        "다시 듣기",
        "sound",
      );
      return;
    }
    synth.cancel();
    let voices = synth.getVoices();
    if (!voices.length) {
      show("loading", "기기 음성을 준비하고 있어요");
      await new Promise((resolve) => {
        const done = () => {
          clearTimeout(t);
          synth.removeEventListener("voiceschanged", done);
          resolve();
        };
        const t = setTimeout(done, 1500);
        synth.addEventListener("voiceschanged", done);
      });
      if (dead) return;
      voices = synth.getVoices();
    }
    const ko = voices.find((v) => v.localService && v.lang.startsWith("ko"));
    if (!ko) {
      show(
        "error",
        "한국어 기기 음성이 필요해요",
        "기기의 음성 설정에서 한국어 음성을 다운로드한 뒤 다시 들어 주세요.",
        "다시 듣기",
        "sound",
      );
      return;
    }
    show("speaking", "질문을 들려드릴게요", "", "다시 듣기", "sound");
    const u = new SpeechSynthesisUtterance(p.question);
    utterance = u;
    u.lang = "ko-KR";
    u.voice = ko;
    u.onend = () => {
      if (!dead && u === utterance)
        show("answer", "이제 들려주세요", "", "답변 녹음 시작");
    };
    u.onerror = (ev) => {
      if (
        !dead &&
        u === utterance &&
        !["canceled", "interrupted"].includes(ev.error)
      )
        show(
          "error",
          "질문 음성을 재생할 수 없어요",
          "기기의 한국어 음성 및 소리 설정을 확인해 주세요.",
          "다시 듣기",
          "sound",
        );
    };
    synth.speak(u);
  }
  talk.onclick = () => {
    if (state === "listening") {
      if (rec.state === "recording") rec.stop();
    } else if (p.pending || retry === "next") advance();
    else if (state === "answer") record();
    else speak();
  };
  show(
    "ready",
    p.pending ? "멈춘 곳에서 이어갈까요?" : "목소리로 시작해요",
    p.pending
      ? "이전 답변을 바탕으로 이어갑니다."
      : "음성은 전사를 위해 Cloudflare에, 답변 내용은 질문과 플랜 생성을 위해 Ollama에 전송됩니다. 원음은 보관하지 않아요.",
    p.pending ? "이어서 진행" : "질문 듣기",
    "sound",
  );
  return cleanup;
}
