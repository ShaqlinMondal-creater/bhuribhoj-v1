"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessShell } from "@/components/layout/MessShell";
import { MessThemeSync } from "@/components/theme/MessThemeSync";
import { clearSessionAction, syncSessionRoleAction } from "@/app/actions/auth";
import { clearToken } from "@/lib/auth/token";
import { homePathForRole, isAdmin, pathForSeat } from "@/lib/auth/roles";
import { authService } from "@/services/authService";
import type { AccountSeat, AuthUser, Role } from "@/types/auth";

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

export function MessSession({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole?: Role;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [seat, setSeat] = useState<AccountSeat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const role = user?.role ?? initialRole;

  useEffect(() => {
    let cancelled = false;

    authService
      .currentUser()
      .then(async (next) => {
        if (cancelled) return;
        await syncSessionRoleAction(next.user.role);
        if (isAdmin(next.user.role)) {
          router.replace(homePathForRole(next.user.role));
          return;
        }
        setUser(next.user);
        setSeat(next.seat);
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
            <MessShell user={user} role={role} status={error}>
              <MessThemeSync />
              {children}
            </MessShell>
          </SetMessSeatContext.Provider>
        </MessSeatContext.Provider>
      </SetMessUserContext.Provider>
    </MessUserContext.Provider>
  );
}
