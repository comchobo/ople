import type { Metadata } from "next";
import { AppShell } from "../components/app-shell";
import "./globals.css";

export const metadata: Metadata = { title: "Ople — 오디세이 플래너" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="m-0 grid h-dvh place-items-center bg-[#eaeaea] font-[-apple-system,BlinkMacSystemFont,Segoe_UI,sans-serif] text-[15px] leading-[1.6] text-[#222] [word-break:keep-all] selection:bg-[#222] selection:text-white [&_a]:underline-offset-4 [&_:is(button,a,input,select,textarea)]:[-webkit-tap-highlight-color:transparent]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
