import type { Metadata } from "next";
import SiteHeader from "../components/site-header/site-header";
import { SiteSessionProvider } from "../components/site-header/site-session";
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
        <SiteSessionProvider>
          <SiteHeader />
          {children}
        </SiteSessionProvider>
      </body>
    </html>
  );
}
