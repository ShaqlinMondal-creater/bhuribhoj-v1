"use client";

import { useEffect, useRef, useState } from "react";

export function useApi<T>(load: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [nonce, setNonce] = useState(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    if (!enabled) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    loadRef
      .current()
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Request failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  return { data, error, loading, reload: () => setNonce((value) => value + 1) };
}
