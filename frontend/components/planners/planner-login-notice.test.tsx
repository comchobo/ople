import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { useSiteSession } from "../site-header/site-session";
import PlannerLoginNotice from "./planner-login-notice";

vi.mock("../site-header/site-session", () => ({ useSiteSession: vi.fn() }));

it.each([
  { account: null, checkingAccount: false, visible: true },
  { account: null, checkingAccount: true, visible: false },
  {
    account: {
      id: "1",
      name: "사용자",
      email: "user@example.com",
      csrf_token: "token",
    },
    checkingAccount: false,
    visible: false,
  },
])(
  "shows the login notice only for a confirmed guest ($visible)",
  ({ account, checkingAccount, visible }) => {
    vi.mocked(useSiteSession).mockReturnValue({
      account,
      checkingAccount,
      clearAccount: vi.fn(),
      openLogin: vi.fn(),
    });

    const html = renderToStaticMarkup(<PlannerLoginNotice />);

    expect(html.includes("로그인한 뒤 내 플래너를 확인해 주세요.")).toBe(
      visible,
    );
  },
);
