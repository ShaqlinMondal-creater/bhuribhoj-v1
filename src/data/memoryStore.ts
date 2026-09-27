import { COLLECTION_NAMES, LIST_COLLECTIONS, type CollectionName } from "@/data/collections";
import { fetchCollection, resetDataRequest } from "@/data/api";

// IN-MEMORY CACHE - NOT the persistence layer.
//
// The JSON files in src/data/json are the persistent source of truth. They are
// read and written by the server-side repository (src/lib/server). This module
// only mirrors them for the running browser tab, so the UI can read every
// collection synchronously and re-render the moment a write succeeds.
//
// The cache starts empty and is filled once, at start-up, by loadServerData().
// Nothing here touches localStorage, sessionStorage or IndexedDB; the only
// localStorage in the app is the login session in src/auth/authService.ts.

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isList = (key: CollectionName) => (LIST_COLLECTIONS as readonly string[]).includes(key);

const emptyState = (): Record<CollectionName, unknown> => {
  const next = {} as Record<CollectionName, unknown>;
  COLLECTION_NAMES.forEach((key) => {
    next[key] = isList(key) ? [] : null;
  });
  return next;
};

let state: Record<CollectionName, unknown> = emptyState();
let version = 0;
const listeners = new Set<() => void>();

export const subscribeToStore = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Monotonic counter rather than a reference to the state object, so
// useSyncExternalStore gets a stable snapshot it can compare cheaply.
export const getStoreVersion = () => version;

const notify = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

export const getCollection = <T,>(key: CollectionName): T => clone(state[key] as T);

export const setCollection = <T,>(key: CollectionName, value: T): void => {
  state[key] = clone(value);
  notify();
};

/** Reads one collection from the server and mirrors it into the cache. */
export const loadCollection = async <T,>(key: CollectionName): Promise<T> => {
  const value = await fetchCollection<T>(key);
  setCollection(key, value);
  return clone(value);
};

/** Loads every collection from the JSON files. Runs once per page load. */
export const loadServerData = async (): Promise<void> => {
  const results = await Promise.allSettled(COLLECTION_NAMES.map((key) => fetchCollection(key)));
  const failures: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") state[COLLECTION_NAMES[index]] = result.value;
    else failures.push(COLLECTION_NAMES[index]);
  });

  notify();

  if (failures.length > 0) {
    throw new Error(`Could not load: ${failures.join(", ")}`);
  }
};

/** Asks the server to restore the seed, then re-reads every collection. */
export const resetFromServer = async (): Promise<void> => {
  await resetDataRequest();
  state = emptyState();
  await loadServerData();
};
