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
const stored = new Map<string, string>();
const storage = {
  getItem: vi.fn((key: string) => stored.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    stored.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    stored.delete(key);
  }),
};

beforeEach(() => {
  stored.clear();
  vi.clearAllMocks();
  vi.stubGlobal("localStorage", storage);
  push.mockReset();
});
afterEach(async () => {
  await act(async () => {
    tree?.unmount();
  });
});

it("opens the temporary login dialog for anonymous start", async () => {
  await mount();
  await act(async () => {
    button("시작하기").props.onClick();
  });
  expect(JSON.stringify(tree.toJSON())).toContain("임시 로그인");
  expect(button("Google로 계속하기").props.disabled).toBe(false);
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
  expect(button("Google로 계속하기").props.disabled).toBe(true);
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

for (const entry of ["시작하기", "로그인"]) {
  it(`logs in from ${entry} and routes to planners`, async () => {
    await mount();
    await act(async () => {
      button(entry).props.onClick();
    });
    await act(async () => {
      await button("Google로 계속하기").props.onClick();
    });
    expect(push).toHaveBeenLastCalledWith("/planners");
    expect(tree.root.findAllByType("dialog")).toHaveLength(0);
    expect(
      tree.root.findAllByType("a").some((a) => a.props.href === "/planners"),
    ).toBe(true);
    await act(async () => {
      tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
    });
    expect(JSON.stringify(tree.toJSON())).toContain("김민수");
    expect(JSON.stringify(tree.toJSON())).toContain("minsu@example.com");
  });
}

it("restores temporary login after remount and clears it on logout", async () => {
  await mount();
  await act(async () => {
    button("로그인").props.onClick();
  });
  await act(async () => {
    await button("Google로 계속하기").props.onClick();
  });
  expect(storage.setItem).toHaveBeenCalledWith("ople.temporary-auth", "true");
  await act(async () => {
    tree.unmount();
  });
  await mount();
  await act(async () => {
    tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
  });
  await act(async () => {
    await button("로그아웃").props.onClick();
  });
  expect(push).toHaveBeenLastCalledWith("/");
  expect(stored.has("ople.temporary-auth")).toBe(false);
  await act(async () => {
    tree.unmount();
  });
  await mount();
  expect(button("로그인")).toBeDefined();
});

it("keeps temporary login usable when storage is blocked", async () => {
  vi.stubGlobal("localStorage", {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  });
  await mount();
  await act(async () => {
    button("로그인").props.onClick();
  });
  await act(async () => {
    await button("Google로 계속하기").props.onClick();
  });
  expect(push).toHaveBeenLastCalledWith("/planners");
  await act(async () => {
    tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
  });
  await act(async () => {
    await button("로그아웃").props.onClick();
  });
  expect(button("로그인")).toBeDefined();
  expect(push).toHaveBeenLastCalledWith("/");
});

it("uses supplied authentication without restoring the temporary account", async () => {
  stored.set("ople.temporary-auth", "true");
  await mount({ user: null });
  expect(button("로그인")).toBeDefined();
  await act(async () => {
    button("로그인").props.onClick();
  });
  expect(button("Google로 계속하기").props.disabled).toBe(true);
});

it("uses the supplied login and permits retry after failure", async () => {
  const login = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(user);
  await mount({ user: null, login });
  await act(async () => {
    button("로그인").props.onClick();
  });
  await act(async () => {
    await button("Google로 계속하기").props.onClick();
  });
  expect(tree.root.findByProps({ role: "alert" }).children.join("")).toContain(
    "다시 시도",
  );
  expect(push).not.toHaveBeenCalled();
  expect(button("Google로 계속하기").props.disabled).toBe(false);
  await act(async () => {
    await button("Google로 계속하기").props.onClick();
  });
  expect(login).toHaveBeenCalledTimes(2);
  expect(push).toHaveBeenCalledWith("/planners");
  expect(storage.setItem).not.toHaveBeenCalled();
  await act(async () => {
    tree.root.findByProps({ "aria-label": "내 계정" }).props.onClick();
  });
  expect(JSON.stringify(tree.toJSON())).toContain(user.email);
});

it("disables login while the adapter is signing in", async () => {
  let complete!: (value: typeof user) => void;
  const login = vi.fn(
    () =>
      new Promise<typeof user>((resolve) => {
        complete = resolve;
      }),
  );
  await mount({ user: null, login });
  await act(async () => {
    button("로그인").props.onClick();
  });
  let pending!: Promise<void>;
  await act(async () => {
    pending = button("Google로 계속하기").props.onClick();
  });
  expect(button("로그인 중…").props.disabled).toBe(true);
  await act(async () => {
    complete(user);
    await pending;
  });
  expect(push).toHaveBeenCalledWith("/planners");
});

it("keeps the signed-in account when the adapter object is recreated", async () => {
  const login = vi.fn(async () => user);
  await mount({ user: null, login });
  await act(async () => {
    button("로그인").props.onClick();
  });
  await act(async () => {
    await button("Google로 계속하기").props.onClick();
  });
  await act(async () => {
    tree.update(
      <AppShell auth={{ user: null, login }}>
        <p>다른 화면</p>
      </AppShell>,
    );
  });
  expect(tree.root.findByProps({ "aria-label": "내 계정" })).toBeDefined();
});
