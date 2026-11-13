import type { ComponentProps } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";
import type { AuthAdapter } from "./auth-types";
import { IntroView } from "./intro-view";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/",
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.stubGlobal("document", { querySelector: vi.fn() });

const user = { name: "테스트 사용자", email: "test@example.com" };
let tree: ReactTestRenderer;
async function mount(auth?: AuthAdapter) {
  await act(async () => {
    tree = create(
      <AppShell auth={auth}>
        <IntroView
          dates={["2026.11", "2027.11", "2028.11", "2029.11", "2030.11"]}
        />
      </AppShell>,
    );
  });
}
function button(label: string) {
  const target = tree.root
    .findAllByType("button")
    .find((b) => b.children.includes(label));
  if (!target) throw new Error(`Missing button: ${label}`);
  return target;
}
beforeEach(() => {
  push.mockReset();
});
afterEach(async () => {
  await act(async () => {
    tree?.unmount();
  });
});

it("opens the unavailable login dialog for anonymous start", async () => {
  await mount();
  await act(async () => {
    button("시작하기").props.onClick();
  });
  expect(JSON.stringify(tree.toJSON())).toContain("로그인 기능 준비 중");
  expect(button("Google로 계속하기").props.disabled).toBe(true);
  expect(push).not.toHaveBeenCalled();
});

it("routes both authenticated start actions to planners", async () => {
  await mount({ user });
  const starts = tree.root
    .findAllByType("button")
    .filter((b) => b.children.includes("시작하기"));
  expect(starts).toHaveLength(2);
  for (const start of starts)
    await act(async () => {
      start.props.onClick();
    });
  expect(push.mock.calls).toEqual([["/planners"], ["/planners"]]);
  expect(
    tree.root.findAllByType("a").some((a) => a.props.href === "/planners"),
  ).toBe(true);
});

it("shows the supplied account and closes it when navigating to planners", async () => {
  await mount({ user });
  await act(async () => {
    tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
  });
  expect(JSON.stringify(tree.toJSON())).toContain(user.name);
  expect(JSON.stringify(tree.toJSON())).toContain(user.email);
  expect(button("로그아웃").props.disabled).toBe(true);
  await act(async () => {
    button("내 플래너 보기").props.onClick();
  });
  expect(push).toHaveBeenCalledWith("/planners");
  expect(tree.root.findAllByType("dialog")).toHaveLength(0);
});

it("logs out through the adapter and returns to anonymous introduction", async () => {
  const logout = vi.fn(async () => {});
  await mount({ user, logout });
  await act(async () => {
    tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
  });
  await act(async () => {
    await button("로그아웃").props.onClick();
  });
  expect(logout).toHaveBeenCalledOnce();
  expect(push).toHaveBeenLastCalledWith("/");
  expect(button("로그인")).toBeDefined();
  await act(async () => {
    button("시작하기").props.onClick();
  });
  expect(JSON.stringify(tree.toJSON())).toContain("로그인 기능 준비 중");
});

it("keeps the account open and permits retry after logout failure", async () => {
  const logout = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(undefined);
  await mount({ user, logout });
  await act(async () => {
    tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
  });
  await act(async () => {
    await button("로그아웃").props.onClick();
  });
  expect(tree.root.findByProps({ role: "alert" }).children.join("")).toContain(
    "다시 시도",
  );
  expect(push).not.toHaveBeenCalled();
  expect(button("로그아웃").props.disabled).toBe(false);
  await act(async () => {
    await button("로그아웃").props.onClick();
  });
  expect(push).toHaveBeenCalledWith("/");
});
