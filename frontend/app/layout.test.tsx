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
  "%s도 루트 레이아웃의 공통 헤더와 인증 UI를 사용한다",
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
    expect(app?.querySelector("header .brand")?.textContent).toBe("Ople");
    expect(app?.querySelector("nav button")?.textContent).toBe("로그인");
    expect(app?.querySelector("main h1")?.textContent).toBe(title);
    expect(app?.querySelector("main")?.classList.contains("board")).toBe(false);
  },
);
