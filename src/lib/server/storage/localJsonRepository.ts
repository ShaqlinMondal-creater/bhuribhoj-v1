import "server-only";

import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { COLLECTIONS, type CollectionName } from "@/lib/server/collections";
import { parseJson, serializeJson } from "@/lib/server/storage/jsonText";
import { initialFileLabel, initialText } from "@/lib/server/storage/seed";
import { DataStoreError, type JsonRepository } from "@/lib/server/storage/types";

// LOCAL DEVELOPMENT STORAGE.
//
// Reads and writes the real JSON files in src/data/json, so a change made during
// `next dev` is physically on disk and a refresh sees it.
//
// Safety measures, all of which live here and nowhere else:
//  - a write goes to a temporary file in the same directory and is then renamed
//    over the target, so a crash or a full disk can never leave a truncated data
//    file behind
//  - a value is serialised in full before anything touches the disk, so a
//    circular or non-serialisable value is rejected before the target is opened
//  - a read or parse failure throws instead of silently returning empty data
// Serialization of overlapping read-modify-write cycles is one level up, in
// src/lib/server/jsonRepository.ts, so it applies to every backend.

const PROJECT_ROOT = process.cwd();
const LIVE_DIR = path.join(PROJECT_ROOT, "src", "data", "json");
const INITIAL_DIR = path.join(PROJECT_ROOT, "src", "data", "initial");

const livePath = (name: CollectionName) => path.join(LIVE_DIR, COLLECTIONS[name].file);
const initialPath = (name: CollectionName) => path.join(INITIAL_DIR, COLLECTIONS[name].file);

const describe = (error: unknown) =>
  error instanceof Error ? error.message : "unknown error";

export class LocalJsonRepository implements JsonRepository {
  readonly kind = "filesystem" as const;

  async existsJson(name: CollectionName): Promise<boolean> {
    try {
      await stat(livePath(name));
      return true;
    } catch {
      return false;
    }
  }

  async readJson<T>(name: CollectionName): Promise<T> {
    const file = COLLECTIONS[name].file;
    let raw: string;
    try {
      raw = await readFile(livePath(name), "utf8");
    } catch (error) {
      throw new DataStoreError(`Could not read ${file}: ${describe(error)}`, 500);
    }
    return parseJson<T>(raw, file);
  }

  /**
   * The seed file byte for byte, so a reset returns the working tree to exactly
   * its committed formatting. Falls back to the bundled seed only when the file
   * is genuinely absent, which does not happen in a normal local checkout.
   */
  async readInitialText(name: CollectionName): Promise<string> {
    try {
      return await readFile(initialPath(name), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return initialText(name);
      throw new DataStoreError(
        `Could not read the seed file for ${name}: ${describe(error)}`,
        500,
      );
    }
  }

  async readInitialJson<T>(name: CollectionName): Promise<T> {
    const raw = await this.readInitialText(name);
    return parseJson<T>(raw, initialFileLabel(name));
  }

  async writeJson(name: CollectionName, value: unknown): Promise<void> {
    await this.writeText(name, serializeJson(value, COLLECTIONS[name].file));
  }

  async resetJson(name: CollectionName): Promise<void> {
    const raw = await this.readInitialText(name);
    // Parsed before the write, so a corrupted seed is reported instead of being
    // written over good data.
    parseJson(raw, initialFileLabel(name));
    await this.writeText(name, raw);
  }

  /**
   * Writes already-formatted text through a temporary file, then renames it over
   * the target. Both paths are in the same directory, so the rename is atomic.
   */
  private async writeText(name: CollectionName, text: string): Promise<void> {
    const target = livePath(name);
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    await mkdir(path.dirname(target), { recursive: true });
    try {
      await writeFile(temporary, text, "utf8");
      await renameWithRetry(temporary, target);
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw new DataStoreError(`Could not write ${COLLECTIONS[name].file}: ${describe(error)}`, 500);
    }
  }
}

/**
 * Windows refuses to replace a file that another process still has open, which
 * surfaces as a transient EPERM/EBUSY/EACCES rather than a real failure. A short
 * retry turns that into a normal write instead of a spurious 500.
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

export const localRepository = new LocalJsonRepository();
