import { type Answer, api } from "./core";

export function getQuestion(interviewId: string, answers: Answer[]) {
  return api<{ question: string }>("/interview/question", {
    interview_id: interviewId,
    answers,
  });
}

export function getSummary(interviewId: string, answers: Answer[]) {
  return api<{ summary: string }>("/interview/summary", {
    interview_id: interviewId,
    answers,
  });
}

export function uploadRecording(
  interviewId: string,
  questionIndex: number,
  audio: Blob,
  duration: number,
) {
  const form = new FormData();
  form.set("audio", audio, "recording");
  form.set("duration", String(duration));
  form.set("interview_id", interviewId);
  form.set("question_index", String(questionIndex));
  return api<{ recording_id: string; text: string }>(
    "/interview/recording",
    form,
  );
}
