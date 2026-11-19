import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <h1>이 페이지를 찾을 수 없어요</h1>
      <p className="not-found-copy">
        주소가 변경되었거나 없는 페이지입니다. 홈에서 나의 가능성을 다시
        탐색해보세요.
      </p>
      <Link href="/" className="button primary">
        홈으로 돌아가기 <ArrowRight aria-hidden="true" />
      </Link>
    </main>
  );
}
