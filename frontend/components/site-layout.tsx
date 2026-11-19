"use client";

import { usePathname } from "next/navigation";
import { useAccountMenu } from "@/hooks/use-account-menu";
import { AccountDialog } from "./account-dialog";
import { Auth } from "./auth";
import { SiteHeader } from "./site-header";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const menu = useAccountMenu();
  const path = usePathname();
  const view =
    path === "/"
      ? "intro"
      : path === "/planners/new"
        ? "interview"
        : path === "/planners"
          ? "planners"
          : "board";

  if (path === "/privacy" || path === "/terms") return <>{children}</>;
  return (
    <div id="app" className={view}>
      <SiteHeader
        authenticated={!!menu.user}
        loading={menu.loading}
        home={() => void menu.navigate("/")}
        planners={() => void menu.navigate("/planners")}
        login={() => menu.setAuth(true)}
        account={() => menu.setAccount(true)}
      />
      {menu.error && (
        <p role="alert" className="error">
          {menu.error}
        </p>
      )}
      {children}
      {menu.auth && (
        <Auth close={() => menu.setAuth(false)} loggedIn={menu.completeLogin} />
      )}
      {menu.account && menu.user && (
        <AccountDialog
          user={menu.user}
          close={() => menu.setAccount(false)}
          planners={() => void menu.openPlanners()}
        />
      )}
    </div>
  );
}
