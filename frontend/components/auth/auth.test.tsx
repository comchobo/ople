import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Auth } from "./auth";

describe("이메일 인증", () => {
  it("가입 메일을 요청하고 인증번호 확인 후 로그인한다", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response('{"ok":true}'))
      .mockResolvedValueOnce(
        new Response('{"id":"u","email":"hello@example.com","name":"hello"}'),
      );
    const loggedIn = vi.fn(),
      user = userEvent.setup();
    render(<Auth close={vi.fn()} loggedIn={loggedIn} />);
    expect(
      screen.getByRole("link", { name: "Google로 계속하기" }),
    ).toHaveAttribute("href", "/api/auth/google");
    await user.click(screen.getByRole("button", { name: "이메일로 회원가입" }));
    await user.type(screen.getByLabelText("이메일"), "hello@example.com");
    await user.type(screen.getByLabelText("비밀번호"), "password123");
    await user.click(screen.getByRole("button", { name: "인증번호 받기" }));
    await user.type(await screen.findByLabelText("인증번호"), "123456");
    expect(
      screen.getByRole("button", { name: /인증번호 재발송/ }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "인증하고 가입하기" }));
    await waitFor(() =>
      expect(loggedIn).toHaveBeenCalledWith(
        expect.objectContaining({ id: "u" }),
      ),
    );
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual({
      email: "hello@example.com",
      code: "123456",
    });
  });
  it("틀린 인증번호 오류 후 다시 입력할 수 있다", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}"))
      .mockResolvedValueOnce(
        new Response('{"detail":"잘못된 인증번호"}', { status: 400 }),
      );
    const user = userEvent.setup();
    render(<Auth close={vi.fn()} loggedIn={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "이메일로 회원가입" }));
    fireEvent.change(screen.getByLabelText("이메일"), {
      target: { value: "hello@example.com" },
    });
    fireEvent.change(screen.getByLabelText("비밀번호"), {
      target: { value: "password123" },
    });
    await user.click(screen.getByRole("button", { name: "인증번호 받기" }));
    await user.type(await screen.findByLabelText("인증번호"), "000000");
    await user.click(screen.getByRole("button", { name: "인증하고 가입하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "잘못된 인증번호",
    );
    expect(
      screen.getByRole("button", { name: "인증하고 가입하기" }),
    ).toBeEnabled();
  });
});
