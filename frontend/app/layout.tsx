import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ople — 오디세이 플래너",
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
