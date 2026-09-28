import "server-only";

import { BlobNotFoundError, get, head, put } from "@vercel/blob";
import { COLLECTIONS, type CollectionName } from "@/lib/server/collections";
import { parseJson, serializeJson } from "@/lib/server/storage/jsonText";
import { initialFileLabel, initialText } from "@/lib/server/storage/seed";
import { DataStoreError, type JsonRepository } from "@/lib/server/storage/types";

// VERCEL DEPLOYMENT STORAGE.
//
// A Vercel Function's filesystem is read-only and discarded between
// invocations, so the JSON datasets live in a private Vercel Blob store instead.
// Each dataset is one JSON object under a fixed pathname, holding exactly the
// structure the equivalent file in src/data/json holds.
//
//   bhuribhoj/users.json
//   bhuribhoj/meals.json
//   bhuribhoj/guestMeals.json
//   bhuribhoj/expenses.json
//   bhuribhoj/mess.json
//   bhuribhoj/settings.json
//
// A CRUD cycle reads the object, changes it and writes the whole object back
// with allowOverwrite. Every read uses useCache: false so a read that follows a
// write in the same session cannot be answered from the CDN with a previous
// version.
//
// Credentials are never passed in by hand. The SDK resolves them from the
// environment: a connected store is identified by BLOB_STORE_ID, for which
// Vercel supplies a short-lived OIDC credential to the running function, and a
// long-lived BLOB_READ_WRITE_TOKEN is used otherwise. Nothing has to be added to
// the environment for OIDC by hand. This module is server-only, so no credential
// can reach the browser.

/** Folder every application dataset lives in, so it cannot collide with other blobs. */
export const BLOB_FOLDER = "bhuribhoj";

export const blobPathname = (name: CollectionName) => `${BLOB_FOLDER}/${COLLECTIONS[name].file}`;

/** Application data is never public. */
const ACCESS = "private" as const;

/**
 * CDN lifetime for the stored object. Reads already bypass the CDN with
 * useCache: false, so this only bounds how long a directly-fetched URL may serve
 * an older version. The Blob minimum is 60 seconds.
 */
const CACHE_CONTROL_MAX_AGE = 60;

const describe = (error: unknown) =>
  error instanceof Error ? error.message : "unknown error";

const isNotFound = (error: unknown) =>
  error instanceof BlobNotFoundError || (error as { name?: string })?.name === "BlobNotFoundError";

export class VercelBlobJsonRepository implements JsonRepository {
  readonly kind = "vercel-blob" as const;

  async existsJson(name: CollectionName): Promise<boolean> {
    try {
      await head(blobPathname(name));
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw new DataStoreError(
        `Could not check ${COLLECTIONS[name].file} in Vercel Blob: ${describe(error)}`,
        500,
      );
    }
  }

  async readJson<T>(name: CollectionName): Promise<T> {
    const file = COLLECTIONS[name].file;
    const pathname = blobPathname(name);

    let result: Awaited<ReturnType<typeof get>>;
    try {
      // useCache: false is what makes a read after a write - and a refresh -
      // see the version that was just saved, rather than a cached one.
      result = await get(pathname, { access: ACCESS, useCache: false });
    } catch (error) {
      throw new DataStoreError(`Could not read ${file} from Vercel Blob: ${describe(error)}`, 500);
    }

    if (!result) {
      // The store has never held this dataset, which is the normal state of a
      // freshly created store. Seed it from the immutable initial data so the
      // deployment is usable, rather than reporting an error the user can do
      // nothing about. This is not a fallback to the filesystem: the seed is
      // bundled into the server build, and the result is written to Blob.
      return this.seedAndRead<T>(name);
    }
    if (result.statusCode !== 200 || !result.stream) {
      throw new DataStoreError(
        `Could not read ${file} from Vercel Blob: unexpected response status ${result.statusCode}.`,
        500,
      );
    }

    return parseJson<T>(await new Response(result.stream).text(), file);
  }

  async readInitialText(name: CollectionName): Promise<string> {
    return initialText(name);
  }

  async readInitialJson<T>(name: CollectionName): Promise<T> {
    return parseJson<T>(await this.readInitialText(name), initialFileLabel(name));
  }

  async writeJson(name: CollectionName, value: unknown): Promise<void> {
    await this.putText(name, serializeJson(value, COLLECTIONS[name].file));
  }

  async resetJson(name: CollectionName): Promise<void> {
    const raw = await this.readInitialText(name);
    // Parsed before the write, so a corrupted seed is reported instead of being
    // written over good data.
    parseJson(raw, initialFileLabel(name));
    await this.putText(name, raw);
  }

  private async seedAndRead<T>(name: CollectionName): Promise<T> {
    const raw = await this.readInitialText(name);
    const value = parseJson<T>(raw, initialFileLabel(name));
    await this.putText(name, raw);
    return value;
  }

  private async putText(name: CollectionName, text: string): Promise<void> {
    try {
      await put(blobPathname(name), text, {
        access: ACCESS,
        // The dataset is a single object that is replaced on every write, so
        // overwriting in place is the intended behaviour.
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: CACHE_CONTROL_MAX_AGE,
      });
    } catch (error) {
      throw new DataStoreError(
        `Could not write ${COLLECTIONS[name].file} to Vercel Blob: ${describe(error)}`,
        500,
      );
    }
  }
}

export const vercelBlobRepository = new VercelBlobJsonRepository();
