import type { Metadata } from "next";
import PlannerLoginNotice from "../../components/planners/planner-login-notice";

export const metadata: Metadata = {
  title: "내 플래너 | Ople",
};

export default function PlannersPage() {
  return (
    <main className="mx-auto w-full max-w-[74.625rem] p-6 text-neutral-800 lg:p-8">
      <h1 className="text-3xl font-bold">내 플래너</h1>
      <PlannerLoginNotice />
    </main>
  );
}
