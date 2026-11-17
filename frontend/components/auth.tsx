"use client";

import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import { Modal } from "./modal";

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
      await api("/auth/signup", { email, password });
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
      const user = await api<User>(
        mode === "verify" ? "/auth/verify" : "/auth/login",
        mode === "verify" ? { email, code } : { email, password },
      );
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
      <a className="button wide google-login" href="/api/auth/google">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
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
      <p className="muted space">또는 이메일로 계속하기</p>
      <form onSubmit={submit}>
        <label className="field" htmlFor="email">
          이메일
        </label>
        <input
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
            <label className="field" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        ) : (
          <>
            <p className="small space">
              메일로 전송한 인증번호를 10분 안에 입력해주세요.
            </p>
            <label className="field" htmlFor="code">
              인증번호
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="text-button"
              type="button"
              disabled={busy || cooldown > 0}
              onClick={sendCode}
            >
              인증번호 재발송{cooldown > 0 ? ` (${cooldown}초)` : ""}
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="error space">
            {error}
          </p>
        )}
        <button className="primary wide space" disabled={busy} type="submit">
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
        className="text-button space"
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError("");
        }}
      >
        {mode === "login" ? "이메일로 회원가입" : "로그인으로 돌아가기"}
      </button>
    </Modal>
  );
}
