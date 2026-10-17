"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSessionAction } from "@/app/actions/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { clearToken } from "@/lib/auth/token";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/types/auth";

export function AdminSession({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

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
        await clearSessionAction();
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <AdminShell user={user}>{children}</AdminShell>;
}
