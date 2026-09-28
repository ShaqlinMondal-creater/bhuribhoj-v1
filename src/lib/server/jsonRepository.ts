import "server-only";

import {
  COLLECTIONS,
  COLLECTION_NAMES,
  isCollectionName,
  type CollectionName,
} from "@/lib/server/collections";
import {
  buildMeta,
  buildWholeMeta,
  filterRows,
  summarizeRows,
  takePage,
} from "@/lib/server/listQuery";
import { getJsonRepository } from "@/lib/server/storage";
import { hashPassword, verifyPassword } from "@/lib/server/passwords";
import { DataStoreError } from "@/lib/server/storage/types";
import type { CollectionMeta, CollectionQuery } from "@/data/collections";

// COLLECTION-AWARE CRUD FACADE.
//
// This is the only module the API routes import. It owns the part of persistence
// that is the same whichever store is underneath: which collections exist, which
// of them hold a list, what a valid record and a valid patch look like, and how
// two overlapping writes to the same collection are kept apart. The actual read
// and write is delegated to a JsonRepository, chosen per process in
// src/lib/server/storage.
//
// It is also where the password boundary lives, so no route can forget it: a
// user record is hashed on the way in and redacted on the way out. The one
// function that still sees a stored hash is readUserCredentials, which is
// server-only and exists so a sign-in can be checked on the server.
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

/**
 * Removes the password from a user record on its way to a caller.
 *
 * The hash is kept on disk and is needed to check a sign-in, but it is never
 * part of what a client receives. Doing it here means every read, create and
 * update of the users collection is covered by one rule, so a new route cannot
 * accidentally ship a credential.
 */
const withoutPassword = <T,>(collection: CollectionName, value: T): T => {
  if (collection !== "users") return value;
  if (Array.isArray(value)) {
    return (value as unknown[]).map((row) => withoutPassword(collection, row)) as unknown as T;
  }
  if (!value || typeof value !== "object") return value;
  const redacted = { ...(value as Record<string, unknown>) };
  delete redacted.password;
  return redacted as T;
};

export const findRecord = async <T,>(collection: string, id: string): Promise<T | null> => {
  const name = requireCollection(collection);
  const data = await readCollection<unknown>(name);
  if (!COLLECTIONS[name].isList) {
    return id === COLLECTIONS[name].singletonId ? (data as T) : null;
  }
  const rows = data as Array<{ id?: string }>;
  return withoutPassword(name, (rows.find((row) => row?.id === id) as T | undefined) ?? null);
};

export type ListResult<T> = { data: T; meta: CollectionMeta | null };

/**
 * Reads a list, narrowed and sliced on the server.
 *
 * The same endpoint serves both needs. With no query it returns the whole
 * collection exactly as before; with `search`, a filter, `page`/`limit` or
 * `summary` it does the work here so the browser only ever receives the rows it
 * is going to show. `meta` travels beside the data so a table can page, count
 * and generate the next id without a second request.
 */
export const listCollection = async <T,>(
  collection: string,
  query: CollectionQuery = {},
): Promise<ListResult<T>> => {
  const name = requireCollection(collection);
  const entry = COLLECTIONS[name];
  const stored = await readCollection<unknown>(name);

  // A singleton document has nothing to filter, page or count.
  if (!entry.isList) {
    return { data: withoutPassword(name, stored) as T, meta: null };
  }

  const rows = stored as Array<Record<string, unknown>>;

  // A summary answers with totals instead of records, which is how the
  // dashboard gets its numbers without downloading anything it will not show.
  if (query.summary !== undefined) {
    const scoped = filterRows(name, rows, query);
    return { data: summarizeRows(name, scoped, query) as T, meta: null };
  }

  const matched = filterRows(name, rows, query);

  // A caller that asked for a page wants a page. A caller that only filtered, or
  // asked for nothing at all, wants every match: a meal log, a guest meal log or
  // an expense log is a working set a view filters and totals in the browser, not
  // a table that pages, and truncating it would silently lose records.
  if (query.page === undefined && query.limit === undefined) {
    return { data: withoutPassword(name, matched) as T, meta: buildWholeMeta(name, rows, matched, entry.idPrefix) };
  }

  const meta = buildMeta(name, rows, matched, query, entry.idPrefix);
  const page = takePage(matched, query, meta.page);
  return { data: withoutPassword(name, page) as T, meta };
};

/**
 * Replaces a plaintext password with a hash before the record is stored.
 *
 * Only the create path can set a password. The users patch schema omits the
 * password, so an update can never rewrite the stored hash, and no route can
 * store a readable password because the hash is applied here rather than being
 * left to a caller.
 */
const withHashedPassword = async <T,>(collection: CollectionName, record: T): Promise<T> => {
  if (collection !== "users") return record;
  const row = record as unknown as Record<string, unknown>;
  if (typeof row?.password !== "string" || row.password === "") return record;
  return { ...row, password: await hashPassword(row.password) } as T;
};

/** The stored id and password hash for an email, or null when there is no match. */
export const readUserCredentials = async (
  email: string,
): Promise<{ id: string; password: string } | null> => {
  const rows = await readCollection<Array<{ id?: string; email?: string; password?: string }>>(
    "users",
  );
  const wanted = email.trim().toLowerCase();
  const match = rows.find((row) => row?.email?.trim().toLowerCase() === wanted);
  if (!match?.id || typeof match.password !== "string") return null;
  return { id: match.id, password: match.password };
};

/** True when the email exists and the password matches its stored hash. */
export const verifyUserCredentials = async (
  email: string,
  password: string,
): Promise<{ id: string } | null> => {
  const credentials = await readUserCredentials(email);
  if (!credentials) return null;
  return (await verifyPassword(password, credentials.password)) ? { id: credentials.id } : null;
};

/**
 * A member_id identifies one member and has to stay that way.
 *
 * Meals and guest meals store a member_id rather than a user id, so two users
 * sharing one would make "who ate this" ambiguous. The id is unique because it is
 * the record key; this is the other half of that rule, enforced on the write so
 * it cannot be violated by any caller.
 */
const assertMemberIdIsFree = async (
  memberId: unknown,
  ownerId: string | undefined,
): Promise<void> => {
  if (typeof memberId !== "string" || memberId === "") return;
  const rows = await readCollection<Array<{ id?: string; member_id?: string | null }>>("users");
  const clash = rows.find(
    (row) => row?.member_id === memberId && row?.id !== ownerId,
  );
  if (clash) {
    throw new DataStoreError(`Member id "${memberId}" is already used by ${clash.id}.`, 409);
  }
};

/**
 * The role decides who carries a member_id.
 *
 * Applied after validation so a caller cannot attach a member_id to a
 * non-member: the field is set to null instead, which is the same thing the
 * services do before they send the request.
 */
const normalizeUser = <T,>(collection: CollectionName, record: T): T => {
  if (collection !== "users") return record;
  const row = record as unknown as Record<string, unknown>;
  if (row?.role === undefined || row.role === "member") return record;
  if (row.member_id === null || row.member_id === undefined) return record;
  return { ...row, member_id: null } as T;
};
/** Creates a record. The caller supplies the id, matching the existing services. */
export const createRecord = async <T,>(collection: string, record: unknown): Promise<T> => {
  const name = requireCollection(collection);
  const entry = COLLECTIONS[name];
  const validated = normalizeUser(
    name,
    await withHashedPassword(name, validateRecord(name, record) as T),
  );

  if (!entry.isList) {
    // A singleton document is replaced wholesale, not appended.
    return withCollectionLock(name, async (): Promise<T> => {
      await writeCollection(name, validated);
      return withoutPassword(name, validated);
    });
  }

  return withCollectionLock(name, async (): Promise<T> => {
    const rows = await readCollection<Array<{ id?: string }>>(name);
    if (rows.some((row) => row?.id === (validated as { id?: string }).id)) {
      throw new DataStoreError(`A ${name} record with that id already exists.`, 409);
    }
    if (name === "users") {
      const { id, member_id: memberId } = validated as { id?: string; member_id?: string | null };
      await assertMemberIdIsFree(memberId, id);
    }
    // The store holds the whole list; the caller is told about the new record.
    await writeCollection(name, [...rows, validated]);
    return withoutPassword(name, validated);
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
      return withoutPassword(name, merged);
    }

    const rows = current as Array<{ id?: string }>;
    const index = rows.findIndex((row) => row?.id === id);
    if (index === -1) {
      // Nothing is written when the record is missing.
      throw new DataStoreError(`No ${name} record with id "${id}".`, 404);
    }
    const merged = normalizeUser(name, validateRecord(name, { ...rows[index], ...changes }) as T);
    if (name === "users") {
      const { member_id: memberId } = merged as { member_id?: string | null };
      await assertMemberIdIsFree(memberId, id);
    }
    const updated = [...rows] as Array<{ id?: string }>;
    (updated as unknown as unknown[])[index] = merged;
    // The store holds the whole list, but the caller is told about the one
    // record it changed, which is what the services mirror into the cache.
    await writeCollection(name, updated);
    return withoutPassword(name, merged);
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
