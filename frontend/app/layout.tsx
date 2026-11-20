import type { Metadata } from "next";
import { Navigation } from "@/components/navigation/navigation";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";
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
      <body className="min-h-dvh bg-paper text-ink selection:bg-ink selection:text-paper">
        <AuthProvider>
          <Navigation />
          <div id="app" className="flex min-h-dvh w-full flex-col bg-paper">
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
