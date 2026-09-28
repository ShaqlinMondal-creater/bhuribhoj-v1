import "server-only";

import type { CollectionName } from "@/lib/server/collections";

// STORAGE ABSTRACTION.
//
// The application persists seven JSON datasets. Where those datasets physically
// live is a deployment detail, so it is confined to this interface and the two
// implementations beside it. Nothing above this layer - the API routes, the
// services, the frontend - knows or cares which one is in use.
//
//   local development      -> LocalJsonRepository        (src/data/json/*.json)
//   Vercel deployment      -> VercelBlobJsonRepository   (private Vercel Blob)
//
// Every method is server-side only. This module must never be imported by a
// client component: it is the boundary that keeps Blob credentials and node:fs
// out of the browser bundle.

export type StorageKind = "filesystem" | "vercel-blob";

export class DataStoreError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DataStoreError";
    this.status = status;
  }
}

export interface JsonRepository {
  /** Human readable identity of the backing store, surfaced in server logs. */
  readonly kind: StorageKind;

  /** Reads one dataset. Rejects with a DataStoreError if it cannot be read. */
  readJson<T>(name: CollectionName): Promise<T>;

  /**
   * Replaces one dataset with the given value. The caller is responsible for
   * validating the value first; implementations only guarantee that what is
   * handed in is serialised atomically and completely.
   */
  writeJson(name: CollectionName, value: unknown): Promise<void>;

  /** Restores one dataset from the immutable seed in src/data/initial. */
  resetJson(name: CollectionName): Promise<void>;

  /** Whether the live dataset currently exists in the backing store. */
  existsJson(name: CollectionName): Promise<boolean>;

  /** The seed text for one dataset, used to verify and to restore. */
  readInitialText(name: CollectionName): Promise<string>;

  /** The seed for one dataset, parsed. */
  readInitialJson<T>(name: CollectionName): Promise<T>;
}
