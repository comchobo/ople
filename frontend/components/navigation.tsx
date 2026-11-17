"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { flushSaves } from "@/lib/api";

let interviewActive = false;
export function setInterviewActive(active: boolean) {
  interviewActive = active;
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

// Index history entries so a cancelled Back/Forward can restore its position
// before Next unmounts the interview. Preserve Next's own history metadata.
export function Navigation() {
  useEffect(() => {
    let index = window.history.state?.opleIndex ?? 0;
    let restoring = false;
    let replaying = false;
    const push = window.history.pushState.bind(window.history);
    const replace = window.history.replaceState.bind(window.history);
    replace({ ...window.history.state, opleIndex: index }, "");
    window.history.pushState = (state, unused, url) => {
      push({ ...state, opleIndex: ++index }, unused, url);
    };
    window.history.replaceState = (state, unused, url) => {
      replace({ ...state, opleIndex: index }, unused, url);
    };
    function pop(event: PopStateEvent) {
      if (replaying) return;
      if (restoring) {
        restoring = false;
        event.stopImmediatePropagation();
        return;
      }
      const next = event.state?.opleIndex;
      if (typeof next !== "number") return;
      event.stopImmediatePropagation();
      if (!confirmLeave()) {
        restoring = true;
        window.history.go(index - next);
        return;
      }
      index = next;
      void flushSaves().then(() => {
        replaying = true;
        window.dispatchEvent(
          new PopStateEvent("popstate", { state: event.state }),
        );
        replaying = false;
      });
    }
    function unload(event: BeforeUnloadEvent) {
      if (!interviewActive) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("popstate", pop, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.history.pushState = push;
      window.history.replaceState = replace;
      window.removeEventListener("popstate", pop, true);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  return null;
}
