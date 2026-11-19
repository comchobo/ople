import { type Answer, api, type Job } from "./core";

export function listGenerations() {
  return api<Job[]>("/generations");
}

export function createGeneration(
  id: string,
  interviewId: string,
  answers: Answer[],
  summary: string,
) {
  return api<Job>(`/generations/${encodeURIComponent(id)}`, {
    interview_id: interviewId,
    answers,
    summary,
  });
}

export function runGeneration(id: string) {
  return api<Job>(`/generations/${encodeURIComponent(id)}/run`, {});
}
