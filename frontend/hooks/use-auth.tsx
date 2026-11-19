"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCurrentUser, logout as logoutUser } from "@/api/auth";
import type { User } from "@/api/core";
import { flushSaves } from "@/api/planners";

type AuthState = {
  user: User | null;
  loading: boolean;
  loggedIn: (user: User) => void;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const version = useRef(0);
  useEffect(() => {
    const current = ++version.current;
    void getCurrentUser()
      .then((value) => {
        if (current === version.current) setUser(value);
      })
      .catch(() => {})
      .finally(() => {
        if (current === version.current) setLoading(false);
      });
    return () => {
      version.current += 1;
    };
  }, []);
  const loggedIn = useCallback((value: User) => {
    version.current += 1;
    setUser(value);
    setLoading(false);
  }, []);
  const logout = useCallback(async () => {
    await flushSaves();
    await logoutUser();
    version.current += 1;
    setUser(null);
  }, []);
  return (
    <AuthContext.Provider value={{ user, loading, loggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
