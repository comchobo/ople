"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wav } from "../../lib/product";

export function useRecorder(maxSeconds: number) {
  const audio = useRef<{
    context: AudioContext;
    stream: MediaStream;
    processor: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
  } | null>(null);
  const chunks = useRef<Float32Array[]>([]);
  const frames = useRef(0);
  const rate = useRef(16000);
  const active = useRef(false);
  const epoch = useRef(0);
  const [state, setState] = useState<
    "idle" | "requesting" | "recording" | "paused"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [interrupted, setInterrupted] = useState(false);

  const release = useCallback(() => {
    epoch.current += 1;
    active.current = false;
    if (audio.current) {
      audio.current.processor.disconnect();
      audio.current.source.disconnect();
      audio.current.stream.getTracks().forEach((track) => {
        track.stop();
      });
      void audio.current.context.close();
      audio.current = null;
    }
  }, []);
  useEffect(() => release, [release]);

  const reset = useCallback(() => {
    release();
    chunks.current = [];
    frames.current = 0;
    setSeconds(0);
    setState("idle");
    setError("");
    setInterrupted(false);
  }, [release]);

  async function start() {
    if (interrupted) return;
    setError("");
    if (frames.current >= rate.current * maxSeconds) return;
    if (audio.current) {
      try {
        await audio.current.context.resume();
        active.current = true;
        setState("recording");
      } catch {
        setError("마이크를 다시 시작하지 못했습니다. 다시 녹음해주세요.");
      }
      return;
    }
    const attempt = epoch.current;
    setState("requesting");
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "이 브라우저에서는 마이크를 사용할 수 없습니다. HTTPS와 마이크 지원을 확인해주세요.",
        );
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (attempt !== epoch.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      const context = new AudioContext();
      await context.resume();
      if (attempt !== epoch.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        await context.close();
        return;
      }
      const source = context.createMediaStreamSource(stream);
      // Native PCM capture keeps all supported browsers on one WAV upload format.
      const processor = context.createScriptProcessor(4096, 1, 1);
      rate.current = context.sampleRate;
      processor.onaudioprocess = (event) => {
        if (!active.current) return;
        const samples = event.inputBuffer.getChannelData(0);
        const remaining = Math.max(
          0,
          Math.floor(maxSeconds * rate.current - frames.current),
        );
        const chunk = samples.slice(0, remaining);
        if (chunk.length) {
          chunks.current.push(chunk);
          frames.current += chunk.length;
        }
        setSeconds(Math.floor(frames.current / rate.current));
        if (frames.current >= maxSeconds * rate.current) {
          active.current = false;
          setState("paused");
        }
      };
      source.connect(processor);
      processor.connect(context.destination);
      audio.current = { context, stream, processor, source };
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          active.current = false;
          setInterrupted(true);
          setState("paused");
          setError(
            "마이크 연결이 끊겼습니다. 녹음된 답변을 제출하거나 다시 녹음해주세요.",
          );
        };
      });
      active.current = true;
      setState("recording");
    } catch (e) {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
      if (attempt === epoch.current) {
        setError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "마이크 권한을 허용한 뒤 다시 시도해주세요."
            : (e as Error).message || "마이크 장치를 사용할 수 없습니다.",
        );
        setState(frames.current ? "paused" : "idle");
      }
    }
  }
  function pause() {
    active.current = false;
    setState("paused");
  }
  function recording() {
    active.current = false;
    if (!frames.current) return null;
    return wav(chunks.current, rate.current);
  }
  return {
    state,
    seconds,
    error,
    interrupted,
    start,
    pause,
    reset,
    release,
    recording,
  };
}
