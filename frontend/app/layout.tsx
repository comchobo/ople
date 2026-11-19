import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { Navigation } from "@/components/layout/navigation";
import { AuthProvider } from "@/hooks/auth/use-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ople — 오디세이 플래너",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Navigation />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
