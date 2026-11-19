"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { flushSaves } from "@/api/planners";

let interviewActive = false;
export function setInterviewActive(active: boolean) {
  interviewActive = active;
}
export function isInterviewActive() {
  return interviewActive;
}
export function confirmLeave() {
  return (
    !interviewActive ||
    window.confirm("인터뷰를 나가면 이어할 수 없습니다. 나갈까요?")
  );
}
export function useAppNavigation() {
  const router = useRouter();
  return useCallback(
    async (path: string, replace = false, completed = false) => {
      if (!completed && !confirmLeave()) return false;
      await flushSaves();
      if (replace) router.replace(path);
      else router.push(path);
      return true;
    },
    [router],
  );
}
