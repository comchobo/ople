import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import RootLayout from "./layout";
import PrivacyPage from "./privacy/page";
import TermsPage from "./terms/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => window.history.replaceState({}, "", "/"));

it.each([
  ["/privacy", PrivacyPage, "개인정보처리방침"],
  ["/terms", TermsPage, "서비스 약관"],
] as const)(
  "%s는 인증 없이 정책 본문과 공통 헤더·푸터를 제공한다",
  (path, Page, title) => {
    window.history.replaceState({}, "", path);
    const document = new DOMParser().parseFromString(
      renderToStaticMarkup(
        <RootLayout>
          <Page />
        </RootLayout>,
      ),
      "text/html",
    );
    const app = document.querySelector("#app");
    expect(app?.querySelector("header a")?.textContent).toBe("Ople");
    expect(app?.querySelector("nav button")?.textContent).toBe("로그인");
    expect(app?.querySelector("main h1")?.textContent).toBe(title);
    expect(app?.querySelector("main")?.textContent).not.toContain("준비 중");
    expect(app?.querySelector("main")?.textContent).toContain(
      "삭제 요청 시까지",
    );
    expect(
      app?.querySelector('main a[href="mailto:help@ople.ink"]'),
    ).not.toBeNull();
    const footer = app?.querySelector(":scope > footer");
    expect(footer?.querySelector('a[href="/privacy"]')?.textContent).toBe(
      "개인정보처리방침",
    );
    expect(footer?.querySelector('a[href="/terms"]')?.textContent).toBe(
      "서비스 약관",
    );
    expect(footer?.previousElementSibling?.tagName).toBe("MAIN");
  },
);
