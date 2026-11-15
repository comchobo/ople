import type { Metadata } from "next";
import PlannerPreview from "../../components/planner-preview/planner-preview";

export const metadata: Metadata = {
  title: "내 플래너 | Ople",
};

export default function PlannersPage() {
  return <PlannerPreview />;
}
