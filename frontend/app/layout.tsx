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
      <body className="m-0 grid h-dvh place-items-center bg-[#eaeaea] text-[15px] leading-[1.6] text-[#222] break-keep [font-family:'Pretendard_Variable',Pretendard,-apple-system,BlinkMacSystemFont,system-ui,Roboto,'Helvetica_Neue','Segoe_UI','Apple_SD_Gothic_Neo','Noto_Sans_KR','Malgun_Gothic','Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol',sans-serif] selection:bg-[#222] selection:text-white">
        <AuthProvider>
          <Navigation />
          <div
            id="app"
            className="m-auto flex h-dvh w-[min(100%,1194px)] flex-col overflow-hidden border border-[#d4d4d4] bg-white"
          >
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
