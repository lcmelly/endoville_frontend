"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import type { LoginUserResponse } from "@/lib/api/users";

type AuthState = LoginUserResponse | null;

type AuthContextValue = {
  auth: AuthState;
  setAuth: (data: LoginUserResponse) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Local storage key for persisting the login response.
const STORAGE_KEY = "endoville.auth";
const SESSION_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(null);

  // Hydrate auth state from localStorage on first client render.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAuthState(JSON.parse(stored) as LoginUserResponse);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Store auth state in memory and persist to localStorage.
  const setAuth = useCallback((data: LoginUserResponse) => {
    setAuthState(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  // Clear auth state in memory and localStorage.
  const clearAuth = useCallback(() => {
    setAuthState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Periodically validate the access token and clear auth if it expires.
  useEffect(() => {
    if (!auth?.access) {
      return;
    }

    let isCancelled = false;

    const checkSession = async () => {
      try {
        await apiFetch("/api/users/me/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.access}`,
          },
        });
      } catch (error) {
        if (!isCancelled && error instanceof ApiError && error.status === 401) {
          clearAuth();
        }
      }
    };

    checkSession();
    const intervalId = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [auth?.access, clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({ auth, setAuth, clearAuth }),
    [auth, setAuth, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
