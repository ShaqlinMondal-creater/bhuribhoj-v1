"use client";

import { useEffect, useState } from "react";
import { loadServerData } from "@/data/memoryStore";

// Fills the in-memory cache from the JSON files, once, before the app renders.
// While this runs the page shows its loading state, so no component ever reads
// an empty collection.
export const useServerData = () => {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadServerData()
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Could not load the data files.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return { status, error };
};
