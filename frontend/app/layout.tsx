import type { Metadata } from "next";
import AppShell from "@/components/common/AppShell";
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
