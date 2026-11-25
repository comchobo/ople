"use client";

import { useEffect, useRef, useState } from "react";

export const RECORDING_LIMIT_SECONDS = 180;
const MAX_RECORDING_BYTES = 20 * 1024 * 1024;

function stopMedia(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function useRecorder(
  submit: (blob: Blob, duration: number) => Promise<void>,
) {
  const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [oversized, setOversized] = useState(false);
  const [starting, setStarting] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const size = useRef(0);
  const secondsRef = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current?.state !== "inactive") recorder.current?.stop();
      stopMedia(stream.current);
    };
  }, []);
  useEffect(() => {
    if (state !== "recording") return;
    const timer = setInterval(() => {
      if (secondsRef.current >= RECORDING_LIMIT_SECONDS) return;
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current >= RECORDING_LIMIT_SECONDS) {
        recorder.current?.pause();
        setState("paused");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);
  async function start() {
    setError("");
    setStarting(true);
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "이 환경에서는 녹음을 사용할 수 없습니다. HTTPS 연결과 브라우저의 마이크 지원을 확인해주세요.",
        );
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stopMedia(media);
        return;
      }
      stream.current = media;
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((value) => MediaRecorder.isTypeSupported(value));
      if (!mime) throw new Error("지원되는 녹음 형식이 없습니다.");
      const value = new MediaRecorder(media, { mimeType: mime });
      chunks.current = [];
      size.current = 0;
      setOversized(false);
      secondsRef.current = 0;
      setSeconds(0);
      value.ondataavailable = (event) => {
        if (recorder.current !== value || !mounted.current) return;
        if (event.data.size) {
          chunks.current.push(event.data);
          size.current += event.data.size;
        }
        if (size.current > MAX_RECORDING_BYTES) {
          setOversized(true);
          if (value.state === "recording") value.pause();
          setState("paused");
          setError("20MB를 초과했습니다. 다시 녹음해주세요.");
        }
      };
      value.onerror = () => {
        setError("녹음 중 오류가 발생했습니다. 다시 녹음해주세요.");
        stopMedia(stream.current);
        setState("idle");
      };
      recorder.current = value;
      value.start(1000);
      setState("recording");
    } catch (cause) {
      stopMedia(stream.current);
      setError((cause as Error).message);
    } finally {
      if (mounted.current) setStarting(false);
    }
  }
  function reset() {
    if (!window.confirm("녹음한 내용을 지우고 다시 녹음할까요?")) return;
    if (recorder.current?.state !== "inactive") recorder.current?.stop();
    stopMedia(stream.current);
    recorder.current = null;
    setOversized(false);
    chunks.current = [];
    secondsRef.current = 0;
    setSeconds(0);
    setState("idle");
    setError("");
  }
  function send() {
    const value = recorder.current;
    if (!value || value.state === "inactive") return;
    value.onstop = () => {
      stopMedia(stream.current);
      const blob = new Blob(chunks.current, { type: value.mimeType });
      if (blob.size > MAX_RECORDING_BYTES) {
        setError("20MB를 초과했습니다. 다시 녹음해주세요.");
        setOversized(true);
        setState("paused");
        return;
      }
      void submit(
        blob,
        Math.max(1, Math.min(secondsRef.current, RECORDING_LIMIT_SECONDS)),
      ).catch((cause) => {
        if (mounted.current) {
          setError((cause as Error).message);
          setState("idle");
        }
      });
    };
    value.stop();
  }
  function pause() {
    recorder.current?.pause();
    setState("paused");
  }
  function resume() {
    if (secondsRef.current >= RECORDING_LIMIT_SECONDS || oversized) return;
    recorder.current?.resume();
    setState("recording");
  }
  return {
    state,
    seconds,
    error,
    starting,
    oversized,
    start,
    pause,
    resume,
    reset,
    send,
  };
}
