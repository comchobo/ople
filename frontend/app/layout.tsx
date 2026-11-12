import type { Metadata } from "next";
import Header from "@/components/common/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ople",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          {/* 인증 상태와 메뉴 동작은 후속 인증·모달 단계에서 연결합니다. */}
          <Header isLoggedIn={false} />
          {children}
        </div>
      </body>
    </html>
  );
}
