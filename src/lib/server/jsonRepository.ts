import "server-only";

import {
  COLLECTIONS,
  COLLECTION_NAMES,
  isCollectionName,
  type CollectionName,
} from "@/lib/server/collections";
import { getJsonRepository } from "@/lib/server/storage";
import { DataStoreError } from "@/lib/server/storage/types";

// COLLECTION-AWARE CRUD FACADE.
//
// This is the only module the API routes import. It owns the part of persistence
// that is the same whichever store is underneath: which collections exist, which
// of them hold a list, what a valid record and a valid patch look like, and how
// two overlapping writes to the same collection are kept apart. The actual read
// and write is delegated to a JsonRepository, chosen per process in
// src/lib/server/storage.
//
// The lock below deliberately covers the read as well as the write. Serializing
// only the final write would still let two overlapping requests both read the
// same snapshot and then overwrite each other, silently losing one update.

export { DataStoreError };

const requireCollection = (value: string): CollectionName => {
  if (!isCollectionName(value)) {
    throw new DataStoreError(`Unknown collection "${value}".`, 404);
  }
  return value;
};

export const readCollection = <T,>(collection: string): Promise<T> =>
  getJsonRepository().readJson<T>(requireCollection(collection));

export const readInitialCollection = <T,>(collection: CollectionName): Promise<T> =>
  getJsonRepository().readInitialJson<T>(collection);

const writeLocks = new Map<CollectionName, Promise<unknown>>();

/**
 * Runs a whole read-modify-write cycle exclusively for one collection.
 */
const withCollectionLock = async <R,>(
  collection: CollectionName,
  task: () => Promise<R>,
): Promise<R> => {
  const previous = writeLocks.get(collection) ?? Promise.resolve();
  // Run whether or not the previous operation succeeded, so one failed write
  // cannot wedge the collection for every later request.
  const run = previous.then(task, task);
  writeLocks.set(collection, run.then(() => undefined, () => undefined));
  return run;
};

/** Writes a validated value. Must be called inside the lock. */
const writeCollection = async (collection: CollectionName, value: unknown) => {
  await getJsonRepository().writeJson(collection, value);
};

const validateRecord = (collection: CollectionName, record: unknown) => {
  const result = COLLECTIONS[collection].recordSchema.safeParse(record);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new DataStoreError(`Invalid ${collection} record - ${detail}`, 422);
  }
  return result.data;
};

const validatePatch = (collection: CollectionName, patch: unknown) => {
  const result = COLLECTIONS[collection].patchSchema.safeParse(patch);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new DataStoreError(`Invalid ${collection} update - ${detail}`, 422);
  }
  return result.data;
};

/**
 * Drops the immutable `id` from an update body before it is validated.
 *
 * A record is identified by the id in the request path, so `id` is not an
 * editable field and the patch schemas deliberately omit it. A form that echoes
 * back the record it was handed sends that id along with the fields the user
 * actually changed, and refusing the whole update over a value that was never
 * meant to be edited is the wrong outcome. Removing it here means an `id` in the
 * body is simply ignored: the path id still selects the record, and the stored id
 * is preserved because the merge below only ever applies the editable fields.
 *
 * Every other key is untouched, so the strict patch schemas still reject unknown
 * fields exactly as before.
 */
const withoutIdentifier = (patch: unknown): unknown => {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return patch;
  if (!("id" in patch)) return patch;
  const editable = { ...(patch as Record<string, unknown>) };
  delete editable.id;
  return editable;
};

export const findRecord = async <T,>(collection: string, id: string): Promise<T | null> => {
  const name = requireCollection(collection);
  const data = await readCollection<unknown>(name);
  if (!COLLECTIONS[name].isList) {
    return id === COLLECTIONS[name].singletonId ? (data as T) : null;
  }
  const rows = data as Array<{ id?: string }>;
  return (rows.find((row) => row?.id === id) as T | undefined) ?? null;
};

export const listCollection = async <T,>(collection: string): Promise<T> =>
  readCollection<T>(requireCollection(collection));

/** Creates a record. The caller supplies the id, matching the existing services. */
export const createRecord = async <T,>(collection: string, record: unknown): Promise<T> => {
  const name = requireCollection(collection);
  const entry = COLLECTIONS[name];
  const validated = validateRecord(name, record) as T;

  if (!entry.isList) {
    // A singleton document is replaced wholesale, not appended.
    return withCollectionLock(name, async (): Promise<T> => {
      await writeCollection(name, validated);
      return validated;
    });
  }

  return withCollectionLock(name, async (): Promise<T> => {
    const rows = await readCollection<Array<{ id?: string }>>(name);
    if (rows.some((row) => row?.id === (validated as { id?: string }).id)) {
      throw new DataStoreError(`A ${name} record with that id already exists.`, 409);
    }
    // The store holds the whole list; the caller is told about the new record.
    await writeCollection(name, [...rows, validated]);
    return validated;
  });
};

export const updateRecord = async <T,>(
  collection: string,
  id: string,
  patch: unknown,
): Promise<T> => {
  const name = requireCollection(collection);
  const entry = COLLECTIONS[name];
  const changes = validatePatch(name, withoutIdentifier(patch)) as Record<string, unknown>;

  if (!entry.isList && id !== entry.singletonId) {
    throw new DataStoreError(`The ${name} document is addressed as "${entry.singletonId}".`, 404);
  }

  return withCollectionLock(name, async (): Promise<T> => {
    // Re-read inside the lock: another request may have written since the check.
    const current = await readCollection<unknown>(name);

    if (!entry.isList) {
      const merged = validateRecord(name, {
        ...(current as Record<string, unknown>),
        ...changes,
      }) as T;
      await writeCollection(name, merged);
      return merged;
    }

    const rows = current as Array<{ id?: string }>;
    const index = rows.findIndex((row) => row?.id === id);
    if (index === -1) {
      // Nothing is written when the record is missing.
      throw new DataStoreError(`No ${name} record with id "${id}".`, 404);
    }
    const merged = validateRecord(name, { ...rows[index], ...changes }) as T;
    const updated = [...rows] as Array<{ id?: string }>;
    (updated as unknown as unknown[])[index] = merged;
    // The store holds the whole list, but the caller is told about the one
    // record it changed, which is what the services mirror into the cache.
    await writeCollection(name, updated);
    return merged;
  });
};

export const deleteRecord = async (collection: string, id: string): Promise<{ id: string }> => {
  const name = requireCollection(collection);
  if (!COLLECTIONS[name].isList) {
    throw new DataStoreError(`The ${name} document cannot be deleted.`, 405);
  }

  return withCollectionLock(name, async () => {
    const rows = await readCollection<Array<{ id?: string }>>(name);
    const remaining = rows.filter((row) => row?.id !== id);
    if (remaining.length === rows.length) {
      throw new DataStoreError(`No ${name} record with id "${id}".`, 404);
    }
    await writeCollection(name, remaining);
    return { id };
  });
};

/**
 * Restores every live dataset from the immutable seed.
 *
 * The seed is validated before it is used, so a corrupted snapshot is reported
 * instead of being written over good data. On the filesystem the seed file is
 * copied byte for byte, which returns the working tree to exactly its committed
 * formatting and a clean git diff.
 */
export const resetAllCollections = async () => {
  const restored: CollectionName[] = [];
  for (const name of COLLECTION_NAMES) {
    await withCollectionLock(name, async () => {
      await getJsonRepository().resetJson(name);
    });
    restored.push(name);
  }
  return restored;
};
