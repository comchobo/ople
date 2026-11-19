import { api, type User } from "./core";

export const googleLoginUrl = "/api/auth/google";

export function getCurrentUser() {
  return api<User>("/auth/me");
}

export function signup(email: string, password: string) {
  return api("/auth/signup", { email, password });
}

export function login(email: string, password: string) {
  return api<User>("/auth/login", { email, password });
}

export function verifyEmail(email: string, code: string) {
  return api<User>("/auth/verify", { email, code });
}

export function logout() {
  return api("/auth/logout", {});
}
