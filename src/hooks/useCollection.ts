"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ensureCollection,
  getCollection,
  getStoreVersion,
  isCollectionLoaded,
  subscribeToStore,
} from "@/data/memoryStore";
import { fetchCollectionPage } from "@/data/api";
import type { CollectionMeta, CollectionName, CollectionQuery } from "@/data/collections";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

/**
 * Reads one whole collection, and only the first time it is asked for.
 *
 * A view that needs meals, guest meals, expenses, the mess document or the
 * settings document calls this as it opens. The first caller pays for the
 * request; everybody after it reads the cache, and a write updates the cache so
 * nothing is refetched. A view that is not on screen passes `enabled: false` and
 * makes no request at all.
 */
export const useCollection = <T,>(key: CollectionName, enabled = true) => {
  // The cache changes underneath this hook, so the version is what tells it to
  // look again: after a write, or after a reset emptied it.
  const version = useSyncExternalStore(subscribeToStore, getStoreVersion, () => 0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Already cached, or nothing on screen wants it: no request, no state change.
    if (!enabled || isCollectionLoaded(key)) return;
    let active = true;
    ensureCollection(key)
      .then(() => {
        if (active) setError("");
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : `Could not load ${key}.`);
      });
    return () => {
      active = false;
    };
  }, [key, enabled, version]);

  // Whether the collection is cached is a fact about the store, not local state,
  // so it is read during render and the version above is what invalidates it.
  const loaded = isCollectionLoaded(key);
  const status: LoadStatus = !enabled
    ? "idle"
    : loaded
      ? "ready"
      : error
        ? "error"
        : "loading";

  return { data: getCollection<T>(key), status, error };
};

export type QueryResult<T> = {
  data: T | null;
  meta: CollectionMeta | null;
  status: LoadStatus;
  error: string;
  reload: () => void;
};

/**
 * Runs a server-side query and keeps only what came back.
 *
 * Nothing is cached here, which is the point: the search, the filters and the
 * page are resolved by the server, so the rows a table holds are exactly the
 * rows it is showing. Changing the query sends a new request rather than
 * filtering a list that is already in the browser.
 */
export const useCollectionQuery = <T,>(
  collection: CollectionName,
  query: CollectionQuery,
  enabled = true,
): QueryResult<T> => {
  // A query is a fresh object on every render, so the effect depends on what it
  // contains rather than on its identity. The parsed copy is a stable stand-in
  // that only changes when the values do.
  const signature = JSON.stringify(query);
  const stableQuery = useMemo<CollectionQuery>(
    () => JSON.parse(signature) as CollectionQuery,
    [signature],
  );
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    status: LoadStatus;
    data: T | null;
    meta: CollectionMeta | null;
    error: string;
  }>({ status: "idle", data: null, meta: null, error: "" });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchCollectionPage<T>(collection, stableQuery)
      .then((page) => {
        // The rows already on screen stay while the next page is fetched, so
        // paging a table does not flash an empty one.
        if (active) setState({ status: "ready", data: page.data, meta: page.meta, error: "" });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setState((previous) => ({
          ...previous,
          status: "error",
          error: cause instanceof Error ? cause.message : `Could not load ${collection}.`,
        }));
      });
    return () => {
      active = false;
    };
  }, [collection, stableQuery, enabled, attempt]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, status: "loading" }));
    setAttempt((value) => value + 1);
  }, []);

  return {
    ...state,
    status: enabled ? state.status : "idle",
    reload,
  };
};
