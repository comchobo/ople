import { PlannerBoardScreen } from "@/components/planner/planner-board-screen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlannerBoardScreen key={id} plannerId={id} />;
}
