import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import AppShell from "../components/common/AppShell";

import Home from "./page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let renderer: ReactTestRenderer | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("self", globalThis);
  push.mockClear();
});

afterEach(async () => {
  await act(async () => renderer?.unmount());
  renderer = undefined;
  vi.unstubAllGlobals();
});

it.each([0, 1])(
  "비로그인 상태에서 시작하기 버튼 %i는 로그인 모달을 연다",
  async (index) => {
    const showModal = vi.fn();
    const showAccountModal = vi.fn();
    await act(async () => {
      renderer = create(
        <AppShell>
          <Home />
        </AppShell>,
        {
          createNodeMock: (element) => {
            if (element.type !== "dialog") return null;
            const props = element.props as { "aria-labelledby"?: string };
            return {
              showModal:
                props["aria-labelledby"] === "login-title"
                  ? showModal
                  : showAccountModal,
            };
          },
        },
      );
    });
    if (!renderer) throw new Error("소개 화면이 렌더링되지 않았습니다.");
    const buttons = renderer.root
      .findAllByType("button")
      .filter((button) => button.children.join("") === "시작하기");
    expect(buttons).toHaveLength(2);
    await act(async () => buttons[index].props.onClick());
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(showAccountModal).not.toHaveBeenCalled();
    expect(
      renderer.root.findByProps({ "aria-labelledby": "login-title" }).type,
    ).toBe("dialog");
    expect(push).not.toHaveBeenCalled();
  },
);

it.each([0, 1])(
  "로그인 상태에서 시작하기 버튼 %i는 /planners로 이동한다",
  async (index) => {
    const showModal = vi.fn();
    await act(async () => {
      renderer = create(
        <AppShell isLoggedIn>
          <Home />
        </AppShell>,
        {
          createNodeMock: (element) =>
            element.type === "dialog" ? { showModal } : null,
        },
      );
    });
    if (!renderer) throw new Error("소개 화면이 렌더링되지 않았습니다.");
    const buttons = renderer.root
      .findAllByType("button")
      .filter((button) => button.children.join("") === "시작하기");
    expect(buttons).toHaveLength(2);
    await act(async () => buttons[index].props.onClick());
    expect(push).toHaveBeenCalledExactlyOnceWith("/planners");
    expect(showModal).not.toHaveBeenCalled();
  },
);
