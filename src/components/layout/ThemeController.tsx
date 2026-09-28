"use client";

import { useEffect } from "react";
import { getSettings } from "@/services/messService";
import { subscribeToStore } from "@/data/memoryStore";

export function ThemeController() {
  useEffect(() => {
    // This renders as soon as there is a session, which is before settings.json
    // has been read, so the document can be missing on the first pass. The
    // default holds the page until it arrives; the subscription then re-runs this
    // and the stored theme takes over. Nothing to fetch and no state to hold.
    const applyTheme = () => {
      document.documentElement.dataset.theme = getSettings()?.theme ?? "bhuri-green";
    };
    applyTheme();
    return subscribeToStore(applyTheme);
  }, []);

  return null;
}