"use client";

import { useEffect } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { applyTheme, isThemeId, readStoredTheme } from "@/lib/theme";
import { messService } from "@/services/messService";
import { settingService } from "@/services/settingService";

/** Applies this mess's theme while on the mess panel. Restores platform theme on leave. */
export function MessThemeSync() {
  const user = useMessUser();

  useEffect(() => {
    if (!user || user.role === "admin") return;
    let cancelled = false;

    messService
      .house(user.role)
      .then(async (payload) => {
        if (cancelled) return;
        const theme = payload.data?.theme;
        if (isThemeId(theme ?? null)) {
          applyTheme(theme, false);
          return;
        }
        try {
          const platform = await settingService.publicFetch();
          if (cancelled) return;
          if (isThemeId(platform.data?.theme)) applyTheme(platform.data.theme, false);
        } catch {
          if (!cancelled) applyTheme(readStoredTheme(), false);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      // Mess theme must not stick on public / login / admin after logout.
      applyTheme(readStoredTheme(), false);
      void settingService
        .publicFetch()
        .then((result) => {
          if (isThemeId(result.data?.theme)) applyTheme(result.data.theme);
        })
        .catch(() => undefined);
    };
  }, [user]);

  return null;
}
