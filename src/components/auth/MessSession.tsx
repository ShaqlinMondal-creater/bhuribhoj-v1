"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessShell } from "@/components/layout/MessShell";
import { clearSessionAction } from "@/app/actions/auth";
import { clearToken } from "@/lib/auth/token";
import { pathForSeat } from "@/lib/auth/roles";
import { authService } from "@/services/authService";
import type { AccountSeat, AuthUser } from "@/types/auth";

const MessUserContext = createContext<AuthUser | null>(null);
const SetMessUserContext = createContext<(user: AuthUser) => void>(() => {});
const MessSeatContext = createContext<AccountSeat | null>(null);
const SetMessSeatContext = createContext<(seat: AccountSeat) => void>(() => {});

export function useMessUser() {
  return useContext(MessUserContext);
}

export function useSetMessUser() {
  return useContext(SetMessUserContext);
}

export function useMessSeat() {
  return useContext(MessSeatContext);
}

export function useSetMessSeat() {
  return useContext(SetMessSeatContext);
}

export function MessSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [seat, setSeat] = useState<AccountSeat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    authService
      .currentUser()
      .then((next) => {
        if (!cancelled) {
          setUser(next.user);
          setSeat(next.seat);
        }
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

  useEffect(() => {
    if (!seat || !user) return;
    if (seat.next === "dashboard") return;
    const dest = pathForSeat(seat.next, user.role);
    if (pathname !== dest) router.replace(dest);
  }, [seat, user, pathname, router]);

  return (
    <MessUserContext.Provider value={user}>
      <SetMessUserContext.Provider value={setUser}>
        <MessSeatContext.Provider value={seat}>
          <SetMessSeatContext.Provider value={setSeat}>
            <MessShell user={user} status={error}>
              {children}
            </MessShell>
          </SetMessSeatContext.Provider>
        </MessSeatContext.Provider>
      </SetMessUserContext.Provider>
    </MessUserContext.Provider>
  );
}
