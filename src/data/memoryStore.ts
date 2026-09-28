import { COLLECTION_NAMES, LIST_COLLECTIONS, type CollectionName } from "@/data/collections";
import { fetchCollection, resetDataRequest } from "@/data/api";

// IN-MEMORY CACHE - NOT the persistence layer.
//
// The JSON files in src/data/json are the persistent source of truth. They are
// read and written by the server-side repository (src/lib/server). This module
// only mirrors them for the running browser tab, so the UI can read a collection
// synchronously and re-render the moment a write succeeds.
//
// Nothing is fetched up front. A collection is only requested when something
// that needs it asks (ensureCollection), and a request that comes back is kept
// until a write or a reset changes it. Nothing here touches localStorage,
// sessionStorage or IndexedDB; the only localStorage in the app is the login
// session in src/auth/authService.ts.

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

/**
 * Which collections have been read in full.
 *
 * A list collection is marked here only when every record is in the cache. The
 * users cache also holds individual records the app happens to have seen, and
 * that must never count as "the whole collection is here".
 */
const loaded = new Set<CollectionName>();

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

/** True once every record of a collection has been read into the cache. */
export const isCollectionLoaded = (key: CollectionName): boolean => loaded.has(key);

/** Reads one collection from the server and mirrors the whole thing in. */
export const loadCollection = async <T,>(key: CollectionName): Promise<T> => {
  const value = await fetchCollection<T>(key);
  state[key] = value;
  loaded.add(key);
  notify();
  return clone(value);
};

/**
 * Reads a collection only if nothing has read it yet.
 *
 * This is what makes loading on demand: the first view that needs a collection
 * pays for it, and every later view reads the cache. Calling it for a collection
 * that is already in the cache makes no request at all.
 */
export const ensureCollection = async <T,>(key: CollectionName): Promise<T> => {
  if (loaded.has(key)) return clone(state[key] as T);
  return loadCollection<T>(key);
};

/** Drops one collection from the cache, so the next reader refetches it. */
export const forgetCollection = (key: CollectionName): void => {
  loaded.delete(key);
  notify();
};

/**
 * Asks the server to restore the seed and empties the cache.
 *
 * Every collection is marked unread rather than refetched, so nothing is loaded
 * behind the user's back: whichever view is open notices that its collection is
 * no longer cached and asks for it again, and no other request is made.
 */
export const resetFromServer = async (): Promise<void> => {
  await resetDataRequest();
  state = emptyState();
  loaded.clear();
  notify();
};
