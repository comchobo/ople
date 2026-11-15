import { PlannersView } from "../../components/planners-view";

const planners = [
  {
    id: "planner-3",
    name: "나의 플래너 3",
    createdAt: "2026-11-15T09:00:00+09:00",
  },
  {
    id: "planner-2",
    name: "나의 플래너 2",
    createdAt: "2026-11-14T09:00:00+09:00",
  },
  {
    id: "planner-1",
    name: "나의 플래너 1",
    createdAt: "2026-11-13T09:00:00+09:00",
  },
];

export default function PlannersPage() {
  return <PlannersView planners={planners} />;
}
