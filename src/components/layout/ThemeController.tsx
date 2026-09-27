"use client";

import { useEffect } from "react";
import { getSettings } from "@/services/messService";
import { subscribeToPrototypeData } from "@/lib/prototypeStorage";

export function ThemeController() {
  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = getSettings().theme ?? "bhuri-green";
    };
    applyTheme();
    return subscribeToPrototypeData(applyTheme);
  }, []);

  return null;
}