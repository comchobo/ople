// TEMP: 리뉴얼 스켈레톤. 실제 구현 시 교체/삭제.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ople",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
