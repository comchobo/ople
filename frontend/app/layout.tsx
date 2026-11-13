import type { Metadata } from "next";
import SiteHeader from "../components/site-header/site-header";
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
        <SiteHeader isSignedIn={false} />
        {children}
      </body>
    </html>
  );
}
