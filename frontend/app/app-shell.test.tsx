import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AppShell from "../components/common/AppShell";
import Home from "./page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let renderer: ReactTestRenderer | undefined;
const loginDialog = { showModal: vi.fn(), close: vi.fn(), open: false };
const accountDialog = { showModal: vi.fn(), close: vi.fn(), open: true };

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("self", globalThis);
  vi.clearAllMocks();
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function renderShell(isLoggedIn: boolean) {
  await act(async () => {
    renderer = create(
      <AppShell isLoggedIn={isLoggedIn}>
        <Home />
      </AppShell>,
      {
        createNodeMock: (element) => {
          if (element.type !== "dialog") return null;
          const props = element.props as { "aria-labelledby"?: string };
          return props["aria-labelledby"] === "login-title"
            ? loginDialog
            : accountDialog;
        },
      },
    );
  });
  if (!renderer) throw new Error("공통 화면이 렌더링되지 않았습니다.");
  return renderer.root;
}

it("opens login from the logged-out header and keeps the introduction link", async () => {
  const root = await renderShell(false);
  const login = root
    .findAllByType("button")
    .find((button) => button.children.join("") === "로그인");
  await act(async () => login?.props.onClick());
  expect(loginDialog.showModal).toHaveBeenCalledTimes(1);
  expect(root.findByType("a").props.href).toBe("/");
  expect(push).not.toHaveBeenCalled();
});

it("previews both login states and updates both start buttons in development", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const root = await renderShell(false);
  const toggle = root.findByProps({ "aria-label": "로그인 상태 미리보기" });
  expect(toggle.props["aria-pressed"]).toBe(false);
  await act(async () => toggle.props.onClick());
  expect(toggle.props["aria-pressed"]).toBe(true);
  expect(root.findByProps({ "aria-label": "계정" })).toBeDefined();
  const buttons = root
    .findAllByType("button")
    .filter((button) => button.children.join("") === "시작하기");
  expect(buttons).toHaveLength(2);
  for (const button of buttons) {
    await act(async () => button.props.onClick());
  }
  expect(push).toHaveBeenCalledTimes(2);
  expect(push).toHaveBeenLastCalledWith("/planners");
  expect(loginDialog.showModal).not.toHaveBeenCalled();

  await act(async () => toggle.props.onClick());
  expect(toggle.props["aria-pressed"]).toBe(false);
  expect(root.findAllByProps({ "aria-label": "계정" })).toHaveLength(0);
  for (const button of buttons) {
    await act(async () => button.props.onClick());
  }
  expect(loginDialog.showModal).toHaveBeenCalledTimes(2);
  expect(push).toHaveBeenCalledTimes(2);
});

it("does not expose the preview toggle in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const root = await renderShell(false);
  expect(
    root.findAllByProps({ "aria-label": "로그인 상태 미리보기" }),
  ).toHaveLength(0);
});

it("navigates to planners from the logged-in header", async () => {
  const root = await renderShell(true);
  const planners = root
    .findAllByType("button")
    .find((button) => button.children.join("") === "내 플래너");
  await act(async () => planners?.props.onClick());
  expect(push).toHaveBeenCalledExactlyOnceWith("/planners");
});

it("opens the account entry point and closes it before navigating to planners", async () => {
  const root = await renderShell(true);
  await act(async () =>
    root.findByProps({ "aria-label": "계정" }).props.onClick(),
  );
  expect(accountDialog.showModal).toHaveBeenCalledTimes(1);
  const planners = root
    .findAllByType("button")
    .find((button) => button.children.join("") === "내 플래너 보기");
  await act(async () => planners?.props.onClick());
  expect(accountDialog.close).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenCalledExactlyOnceWith("/planners");
});
