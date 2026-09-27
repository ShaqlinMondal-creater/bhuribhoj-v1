import "server-only";

import { readFile, writeFile, rename, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  COLLECTIONS,
  COLLECTION_NAMES,
  isCollectionName,
  type CollectionName,
} from "@/lib/server/collections";

// SERVER-SIDE JSON FILE PERSISTENCE.
//
// The JSON files in src/data/json are the persistent data store for this
// prototype. They are read and written here, and only here, with node:fs.
//
// Safety measures:
//  - every write is validated against the collection schema first
//  - writes go to a temporary file and are then renamed over the target, so a
//    crash can never leave a half-written file behind
//  - writes to the same file are serialized through a promise chain, so two
//    overlapping requests cannot interleave read-modify-write cycles
//  - a read or parse failure throws instead of silently returning empty data

export class DataStoreError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "DataStoreError";
    this.status = status;
  }
}

const PROJECT_ROOT = process.cwd();
const LIVE_DIR = path.join(PROJECT_ROOT, "src", "data", "json");
const INITIAL_DIR = path.join(PROJECT_ROOT, "src", "data", "initial");

const liveFilePath = (collection: CollectionName) =>
  path.join(LIVE_DIR, COLLECTIONS[collection].file);
const initialFilePath = (collection: CollectionName) =>
  path.join(INITIAL_DIR, COLLECTIONS[collection].file);

const requireCollection = (value: string): CollectionName => {
  if (!isCollectionName(value)) {
    throw new DataStoreError(`Unknown collection "${value}".`, 404);
  }
  return value;
};

const parseJson = <T,>(raw: string, file: string): T => {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new DataStoreError(
      `Could not parse ${file}: ${error instanceof Error ? error.message : "invalid JSON"}`,
      500,
    );
  }
};

export const readCollection = async <T,>(collection: string): Promise<T> => {
  const name = requireCollection(collection);
  const file = liveFilePath(name);
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    throw new DataStoreError(
      `Could not read ${COLLECTIONS[name].file}: ${error instanceof Error ? error.message : "unknown error"}`,
      500,
    );
  }
  return parseJson<T>(raw, COLLECTIONS[name].file);
};

const readInitialFile = async (collection: CollectionName): Promise<string> => {
  try {
    return await readFile(initialFilePath(collection), "utf8");
  } catch (error) {
    throw new DataStoreError(
      `Could not read the seed file for ${collection}: ${error instanceof Error ? error.message : "unknown error"}`,
      500,
    );
  }
};

export const readInitialCollection = async <T,>(collection: CollectionName): Promise<T> =>
  parseJson<T>(await readInitialFile(collection), `initial/${COLLECTIONS[collection].file}`);

const writeLocks = new Map<CollectionName, Promise<unknown>>();

/**
 * Runs a whole read-modify-write cycle exclusively for one collection.
 *
 * The lock deliberately covers the read as well as the write. Serializing only
 * the final write would still let two overlapping requests both read the same
 * snapshot and then overwrite each other, silently losing one of the updates.
 */
const withCollectionLock = async <R,>(
  collection: CollectionName,
  task: () => Promise<R>,
): Promise<R> => {
  const previous = writeLocks.get(collection) ?? Promise.resolve();
  // Run whether or not the previous operation succeeded, so one failed write
  // cannot wedge the file for every later request.
  const run = previous.then(task, task);
  writeLocks.set(collection, run.then(() => undefined, () => undefined));
  return run;
};

/** Writes a validated value to the file. Must be called inside the lock. */
const writeJson = async (collection: CollectionName, value: unknown) => {
  await writeTextAtomically(collection, `${JSON.stringify(value, null, 2)}\n`);
};

/**
 * Writes already-formatted text through a temporary file, then renames it over
 * the target. A crash mid-write can therefore never truncate a data file, and a
 * failed rename does not leave the temporary file behind.
 */
const writeTextAtomically = async (collection: CollectionName, text: string) => {
  const file = liveFilePath(collection);
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await mkdir(path.dirname(file), { recursive: true });
  try {
    await writeFile(temporary, text, "utf8");
    await renameWithRetry(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw new DataStoreError(
      `Could not write ${COLLECTIONS[collection].file}: ${error instanceof Error ? error.message : "unknown error"}`,
      500,
    );
  }
};

/**
 * Windows refuses to replace a file that another process still has open, which
 * surfaces as a transient EPERM/EBUSY/EACCES rather than a real failure. A
 * short retry turns that into a normal write instead of a spurious 500.
 */
const renameWithRetry = async (from: string, to: string, attempts = 5) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await rename(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      const retryable = code === "EPERM" || code === "EBUSY" || code === "EACCES";
      if (!retryable || attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * attempt));
    }
  }
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
      await writeJson(name, validated);
      return validated;
    });
  }

  return withCollectionLock(name, async (): Promise<T> => {
    const rows = await readCollection<Array<{ id?: string }>>(name);
    if (rows.some((row) => row?.id === (validated as { id?: string }).id)) {
      throw new DataStoreError(`A ${name} record with that id already exists.`, 409);
    }
    // The file holds the whole list; the caller is told about the new record.
    await writeJson(name, [...rows, validated]);
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
  const changes = validatePatch(name, patch) as Record<string, unknown>;

  if ("id" in changes) {
    throw new DataStoreError("A record id cannot be changed.", 422);
  }

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
      await writeJson(name, merged);
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
    // The file holds the whole list, but the caller is told about the one
    // record it changed, which is what the services mirror into the cache.
    await writeJson(name, updated);
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
    await writeJson(name, remaining);
    return { id };
  });
};

/**
 * Restores every live file from the immutable seed.
 *
 * The seed is copied byte for byte rather than re-serialized, so a reset returns
 * the working tree to exactly its original formatting and a clean git diff.
 * The seed is still parsed first, so a corrupted snapshot is reported instead of
 * being written over good data.
 */
export const resetAllCollections = async () => {
  const restored: CollectionName[] = [];
  for (const name of COLLECTION_NAMES) {
    const raw = await readInitialFile(name);
    parseJson(raw, `initial/${COLLECTIONS[name].file}`);
    await withCollectionLock(name, () => writeTextAtomically(name, raw));
    restored.push(name);
  }
  return restored;
};
