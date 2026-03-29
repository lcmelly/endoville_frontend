"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getSession, logoutUser } from "@/lib/api/users";
import type { AuthenticatedUser } from "@/lib/api/users";

type AuthState = AuthenticatedUser | null;

type AuthContextValue = {
  auth: AuthState;
  authLoading: boolean;
  setAuth: (data: AuthenticatedUser) => void;
  clearAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const setAuth = useCallback((data: AuthenticatedUser) => {
    setAuthState(data);
    setAuthLoading(false);
  }, []);

  const clearAuth = useCallback(async () => {
    setAuthState(null);
    setAuthLoading(false);
    try {
      await logoutUser();
    } catch {
      // Ignore logout transport failures after clearing local state.
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const hydrateSession = async () => {
      try {
        const session = await getSession();
        if (!isCancelled) {
          setAuthState(session.user ? { user: session.user } : null);
        }
      } catch {
        if (!isCancelled) {
          setAuthState(null);
        }
      } finally {
        if (!isCancelled) {
          setAuthLoading(false);
        }
      }
    };

    hydrateSession();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Periodically validate the cookie-backed session and clear auth if it expires.
  useEffect(() => {
    if (!auth?.user) {
      return;
    }

    let isCancelled = false;

    const checkSession = async () => {
      try {
        const session = await getSession();
        if (!session.user && !isCancelled) {
          await clearAuth();
        }
      } catch (error) {
        if (!isCancelled && error instanceof ApiError && error.status === 401) {
          await clearAuth();
        }
      }
    };

    checkSession();
    const intervalId = window.setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [auth?.user, clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({ auth, authLoading, setAuth, clearAuth }),
    [auth, authLoading, setAuth, clearAuth]
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
