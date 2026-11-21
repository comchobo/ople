import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { savePlanner } from "@/api/planners";
import { setInterviewActive } from "@/hooks/use-app-navigation";
import { SiteFooter } from "./site-footer";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  setInterviewActive(false);
  router.push.mockReset();
});

it("정책 링크 이동 시 인터뷰 이탈 취소를 존중한다", async () => {
  render(<SiteFooter />);
  const user = userEvent.setup();
  setInterviewActive(true);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const privacy = screen.getByRole("link", { name: "개인정보처리방침" });
  expect(privacy).toHaveAttribute("href", "/privacy");
  await user.click(privacy);
  expect(confirm).toHaveBeenCalledOnce();
  expect(router.push).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  await user.click(privacy);
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/privacy"));
});

it("진행 중인 플래너 저장 API가 완료된 뒤 약관으로 이동한다", async () => {
  let resolveSave = (_response: Response) => {};
  const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        resolveSave = resolve;
      }),
  );
  const planner = {
    id: "p",
    name: "수정한 플래너",
    created_at: "2026-11-19T00:00:00Z",
    is_favorite: false,
    plans: [],
  };
  const saving = savePlanner(planner);
  render(<SiteFooter />);
  await waitFor(() => expect(fetcher).toHaveBeenCalled());
  await userEvent
    .setup()
    .click(screen.getByRole("link", { name: "서비스 약관" }));
  expect(fetcher).toHaveBeenCalledWith(
    "/api/planners/p",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({ name: planner.name, plans: [] }),
    }),
  );
  expect(router.push).not.toHaveBeenCalled();
  resolveSave(new Response(JSON.stringify(planner)));
  await saving;
  await waitFor(() => expect(router.push).toHaveBeenCalledWith("/terms"));
});
