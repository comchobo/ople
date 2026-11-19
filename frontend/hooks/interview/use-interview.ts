"use client";

import { useEffect, useRef, useState } from "react";
import type { Answer, Job } from "@/api/core";
import { createGeneration, runGeneration } from "@/api/generations";
import { getQuestion, getSummary, uploadRecording } from "@/api/interview";
import { setInterviewActive } from "@/hooks/use-app-navigation";

export function useInterview(generated: (job: Job) => void) {
  const [interviewId] = useState(() => crypto.randomUUID());
  const [jobId] = useState(() => crypto.randomUUID());
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [question, setQuestion] = useState("");
  const [summary, setSummary] = useState("");
  const [phase, setPhase] = useState<
    "prepare" | "interview" | "summary" | "generating"
  >("prepare");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    setInterviewActive(!submitted);
    return () => setInterviewActive(false);
  }, [submitted]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function advance(values: Answer[]) {
    setBusy(true);
    setError("");
    try {
      if (values.length === 10) {
        const result = await getSummary(interviewId, values);
        if (mounted.current) {
          setSummary(result.summary);
          setPhase("summary");
        }
      } else {
        const result = await getQuestion(interviewId, values);
        if (mounted.current) {
          setQuestion(result.question);
          setPhase("interview");
        }
      }
    } catch (cause) {
      if (mounted.current) setError((cause as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function submit(blob: Blob, duration: number) {
    setBusy(true);
    setError("");
    try {
      const result = await uploadRecording(
        interviewId,
        answers.length,
        blob,
        duration,
      );
      if (!mounted.current) return;
      const values = [
        ...answers,
        { question, answer: result.text, recording_id: result.recording_id },
      ];
      setAnswers(values);
      setQuestion("");
      await advance(values);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    setPhase("generating");
    try {
      await createGeneration(jobId, interviewId, answers, summary);
      if (mounted.current) setSubmitted(true);
      const job = await runGeneration(jobId);
      if (mounted.current) generated(job);
    } catch (cause) {
      if (mounted.current) setError((cause as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return {
    answers,
    question,
    summary,
    phase,
    busy,
    error,
    submit,
    start: () => advance([]),
    retry: () => (phase === "generating" ? generate() : advance(answers)),
    generate,
  };
}
