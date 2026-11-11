"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyTheme, isThemeId } from "@/lib/theme";
import { settingService } from "@/services/settingService";

/** Loads the platform theme for public/admin. Re-applies when leaving the mess panel. */
export function ThemeSync() {
  const pathname = usePathname();
  const onMess = pathname === "/mess" || pathname.startsWith("/mess/");

  useEffect(() => {
    if (onMess) return;
    let cancelled = false;
    settingService
      .publicFetch()
      .then((result) => {
        if (cancelled) return;
        const theme = result.data?.theme;
        if (isThemeId(theme)) applyTheme(theme);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [onMess, pathname]);

  return null;
}
