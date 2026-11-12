import Link from "next/link";

export default function Planners() {
  return (
    <main className="page-content" aria-labelledby="planners-title">
      <h1 id="planners-title">내 플래너</h1>
      <p className="space muted">플래너 화면을 준비하고 있습니다.</p>
      <p className="space">
        <Link href="/">소개 화면으로 돌아가기</Link>
      </p>
    </main>
  );
}
