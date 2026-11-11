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
        const theme = payload.data?.theme ?? null;
        if (isThemeId(theme)) {
          applyTheme(theme, false);
          return;
        }
        try {
          const platform = await settingService.publicFetch();
          if (cancelled) return;
          const platformTheme = platform.data?.theme ?? null;
          if (isThemeId(platformTheme)) applyTheme(platformTheme, false);
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
          const platformTheme = result.data?.theme ?? null;
          if (isThemeId(platformTheme)) applyTheme(platformTheme);
        })
        .catch(() => undefined);
    };
  }, [user]);

  return null;
}
