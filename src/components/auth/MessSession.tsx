"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessShell } from "@/components/layout/MessShell";
import { clearSessionAction } from "@/app/actions/auth";
import { clearToken } from "@/lib/auth/token";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/types/auth";

const MessUserContext = createContext<AuthUser | null>(null);

export function useMessUser() {
  return useContext(MessUserContext);
}

export function MessSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authService
      .currentUser()
      .then((next) => {
        if (!cancelled) setUser(next);
      })
      .catch(async () => {
        if (cancelled) return;
        clearToken();
        setError("Session expired. Sign in again.");
        await clearSessionAction();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <MessUserContext.Provider value={user}>
      <MessShell user={user} status={error}>
        {children}
      </MessShell>
    </MessUserContext.Provider>
  );
}
