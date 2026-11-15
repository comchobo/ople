import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 플래너 | Ople",
};

export default function PlannersPage() {
  return (
    <main className="mx-auto w-full max-w-[74.625rem] p-6 text-neutral-800 lg:p-8">
      <h1 className="text-3xl font-bold">내 플래너</h1>
      <p className="mt-4 text-neutral-600">
        상단의 ‘로그인’ 버튼을 눌러 로그인한 뒤 내 플래너를 확인해 주세요.
      </p>
    </main>
  );
}
