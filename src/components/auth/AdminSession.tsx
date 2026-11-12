"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSessionAction, syncSessionRoleAction } from "@/app/actions/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { homePathForRole, isAdmin } from "@/lib/auth/roles";
import { clearToken } from "@/lib/auth/token";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/types/auth";

const AdminUserContext = createContext<AuthUser | null>(null);
const SetAdminUserContext = createContext<(user: AuthUser) => void>(() => {});

export function useAdminUser() {
  return useContext(AdminUserContext);
}

export function useSetAdminUser() {
  return useContext(SetAdminUserContext);
}

export function AdminSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    authService
      .currentUser()
      .then(async (next) => {
        if (cancelled) return;
        await syncSessionRoleAction(next.user.role);
        if (!isAdmin(next.user.role)) {
          router.replace(homePathForRole(next.user.role));
          return;
        }
        setUser(next.user);
      })
      .catch(async () => {
        if (cancelled) return;
        clearToken();
        await clearSessionAction();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AdminUserContext.Provider value={user}>
      <SetAdminUserContext.Provider value={setUser}>
        <AdminShell user={user}>{children}</AdminShell>
      </SetAdminUserContext.Provider>
    </AdminUserContext.Provider>
  );
}
