"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { googleLoginUrl, login, signup, verifyEmail } from "@/api/auth";
import type { User } from "@/api/core";
import { Modal } from "@/components/modal";

export function Auth({
  close,
  loggedIn,
}: {
  close: () => void;
  loggedIn: (user: User) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const VisibilityIcon = passwordVisible ? EyeOff : Eye;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      await signup(email, password);
      setMode("verify");
      setCooldown(60);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "signup") return sendCode();
    setBusy(true);
    setError("");
    try {
      const user = await (mode === "verify"
        ? verifyEmail(email, code)
        : login(email, password));
      loggedIn(user);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        mode === "login"
          ? "로그인"
          : mode === "signup"
            ? "회원가입"
            : "이메일 인증"
      }
      close={close}
    >
      <a
        className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[3px] border border-[#d4d4d4] bg-white px-3.5 py-[9px] text-center leading-[1.4] no-underline hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px]"
        href={googleLoginUrl}
      >
        <svg
          aria-hidden="true"
          className="size-[18px] shrink-0"
          focusable="false"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.71-.06-1.39-.18-2.05H12v3.88h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.75 3.28-7.92Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.17-4.54H2.15v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.83 14.09A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.43.35-2.09V7.07H2.15A11 11 0 0 0 1 12c0 1.78.43 3.46 1.15 4.93l3.68-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.07l3.68 2.84C6.7 7.31 9.13 5.38 12 5.38Z"
          />
        </svg>
        Google로 계속하기
      </a>
      <p className="mt-6 text-[#666]">또는 이메일로 계속하기</p>
      <form onSubmit={submit}>
        <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="email">
          이메일
        </label>
        <input
          className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          disabled={mode === "verify"}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode !== "verify" ? (
          <>
            <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="password">
              비밀번호
            </label>
            <div className="relative">
              <input
                className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] pr-12 caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
                id="password"
                type={passwordVisible ? "text" : "password"}
                minLength={8}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                aria-label={
                  passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기"
                }
                className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-[3px] text-[#222] focus-visible:outline-2 focus-visible:-outline-offset-4"
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                <VisibilityIcon aria-hidden="true" size={20} />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-6 text-[12px]">
              메일로 전송한 인증번호를 10분 안에 입력해주세요.
            </p>
            <label className="mt-4 mb-1.5 block text-[13px]" htmlFor="code">
              인증번호
            </label>
            <input
              className="block min-h-11 w-full rounded-[3px] border border-[#aaa] bg-white p-[11px] caret-[#222] focus:[outline:2px_solid_#555] focus:[outline-offset:1px]"
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="min-h-11 cursor-pointer rounded-[3px] border border-transparent bg-transparent p-2 leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
              type="button"
              disabled={busy || cooldown > 0}
              onClick={sendCode}
            >
              인증번호 재발송{cooldown > 0 ? ` (${cooldown}초)` : ""}
            </button>
          </>
        )}
        {error && (
          <p
            role="alert"
            className="mt-6 border border-[#555] bg-[#f0f0f0] p-3.5"
          >
            {error}
          </p>
        )}
        <button
          className="mt-6 w-full min-h-11 cursor-pointer rounded-[3px] border border-[#222] bg-[#222] px-3.5 py-[9px] leading-[1.4] text-white hover:border-[#999] hover:bg-[#444] hover:text-white focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
          disabled={busy}
          type="submit"
        >
          {busy
            ? "처리 중…"
            : mode === "login"
              ? "로그인"
              : mode === "signup"
                ? "인증번호 받기"
                : "인증하고 가입하기"}
        </button>
      </form>
      <button
        className="mt-6 min-h-11 cursor-pointer rounded-[3px] border border-transparent bg-transparent p-2 leading-[1.4] underline underline-offset-4 hover:border-[#999] hover:bg-[#f3f3f3] focus-visible:[outline:2px_solid_#222] focus-visible:[outline-offset:3px] disabled:cursor-default disabled:opacity-[0.45]"
        type="button"
        onClick={() => {
          setPasswordVisible(false);
          setMode(mode === "login" ? "signup" : "login");
          setError("");
        }}
      >
        {mode === "login" ? "이메일로 회원가입" : "로그인으로 돌아가기"}
      </button>
    </Modal>
  );
}
