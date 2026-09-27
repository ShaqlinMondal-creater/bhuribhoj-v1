"use client";

import { useEffect } from "react";
import { getSettings } from "@/services/messService";
import { subscribeToStore } from "@/data/memoryStore";

export function ThemeController() {
  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.dataset.theme = getSettings().theme ?? "bhuri-green";
    };
    applyTheme();
    return subscribeToStore(applyTheme);
  }, []);

  return null;
}