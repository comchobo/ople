import type { Metadata } from "next";
import { Navigation } from "@/components/navigation/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { AuthProvider } from "@/hooks/use-auth";
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
          <div id="app">
            <SiteHeader />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
