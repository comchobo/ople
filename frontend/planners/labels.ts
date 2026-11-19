import type { Category, ScoreKey } from "@/api/core";

export const categories: Record<Category, string> = {
  work: "일",
  creative: "창작",
  relation: "관계",
  rest: "휴식",
};
export const ratingLabels: Record<ScoreKey, string> = {
  resources: "자원",
  appeal: "호감",
  confidence: "자신감",
  coherence: "일관성",
};
export const ratingHelp: Record<ScoreKey, string> = {
  resources: "필요한 시간·비용·역량을 확보할 수 있나요?",
  appeal: "이 삶의 모습에 얼마나 끌리나요?",
  confidence: "실행할 수 있다는 자신감은 어느 정도인가요?",
  coherence: "내 가치와 원하는 삶에 얼마나 맞나요?",
};
