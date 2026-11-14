import type { AuthAdapter, AuthUser } from "./auth-types";

const storageKey = "ople.temporary-auth";
const demoUser: AuthUser = { name: "김민수", email: "minsu@example.com" };

export function restoreTemporaryUser(): AuthUser | null {
  try {
    return localStorage.getItem(storageKey) === "true" ? demoUser : null;
  } catch {
    return null;
  }
}

export const temporaryAuth: AuthAdapter = {
  user: null,
  async login() {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Storage may be unavailable; keep the current session usable.
    }
    return demoUser;
  },
  async logout() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Logging out of the current session must not depend on storage.
    }
  },
};
