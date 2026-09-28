import "server-only";

import { localRepository } from "@/lib/server/storage/localJsonRepository";
import { DataStoreError, type JsonRepository } from "@/lib/server/storage/types";
import { vercelBlobRepository } from "@/lib/server/storage/vercelBlobJsonRepository";

// SERVER-SIDE STORAGE SELECTION.
//
// Picks the repository the API routes persist through. The rule set is:
//
//   local, nothing configured   -> filesystem, so `npm run dev` needs no setup
//   Blob credentials present    -> Blob, so `vercel env pull` is enough
//   running on Vercel           -> Blob, always
//
// On Vercel there is deliberately no filesystem fallback. A function's
// filesystem is read-only and discarded between invocations, so silently
// writing there would look like it worked while losing every change. If Blob is
// required but not configured, every operation fails with an error that says so
// instead.
//
// The decision reads only the environment and is a pure function, so it can be
// checked directly without standing up a store.

export type StoragePlan =
  | { kind: "filesystem"; reason: string }
  | { kind: "vercel-blob"; configured: true; reason: string }
  | { kind: "vercel-blob"; configured: false; reason: string };

type EnvironmentLike = Record<string, string | undefined>;

const FILESYSTEM = "filesystem";
const BLOB = "vercel-blob";

type FilesystemMode = typeof FILESYSTEM;
type BlobMode = typeof BLOB;

const isFilled = (value: string | undefined) => Boolean(value?.trim());

/** Maps BHURIBHOJ_STORAGE to a mode, rejecting anything unrecognised. */
const readOverride = (raw: string | undefined): FilesystemMode | BlobMode | "invalid" | null => {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (value === FILESYSTEM || value === "fs" || value === "local") return FILESYSTEM;
  if (value === BLOB || value === "vercel") return BLOB;
  return "invalid";
};

export const resolveStoragePlan = (env: EnvironmentLike = process.env): StoragePlan => {
  // OIDC is the current Vercel-supported mechanism and rotates on its own, so it
  // is checked first. A long-lived read-write token is still accepted.
  const oidcConfigured = isFilled(env.VERCEL_OIDC_TOKEN) && isFilled(env.BLOB_STORE_ID);
  const tokenConfigured = isFilled(env.BLOB_READ_WRITE_TOKEN);
  const blobConfigured = oidcConfigured || tokenConfigured;
  const credentialSource = oidcConfigured
    ? "VERCEL_OIDC_TOKEN + BLOB_STORE_ID"
    : tokenConfigured
      ? "BLOB_READ_WRITE_TOKEN"
      : "none";

  const override = readOverride(env.BHURIBHOJ_STORAGE);
  if (override === "invalid") {
    throw new DataStoreError(
      `BHURIBHOJ_STORAGE must be "${FILESYSTEM}" or "${BLOB}", not "${env.BHURIBHOJ_STORAGE}".`,
      500,
    );
  }
  if (override === FILESYSTEM) {
    return { kind: FILESYSTEM, reason: "BHURIBHOJ_STORAGE overrides the default" };
  }
  if (override === BLOB) {
    return blobConfigured
      ? { kind: BLOB, configured: true, reason: "BHURIBHOJ_STORAGE overrides the default" }
      : { kind: BLOB, configured: false, reason: "BHURIBHOJ_STORAGE requests Blob" };
  }

  if (isFilled(env.VERCEL)) {
    // Running on Vercel. Filesystem writes cannot persist here, so Blob is the
    // only correct target even when the credentials have not been added yet.
    return blobConfigured
      ? { kind: BLOB, configured: true, reason: `running on Vercel with ${credentialSource}` }
      : { kind: BLOB, configured: false, reason: "running on Vercel without Blob credentials" };
  }

  if (blobConfigured) {
    return { kind: BLOB, configured: true, reason: `Blob credentials found (${credentialSource})` };
  }

  return { kind: FILESYSTEM, reason: "no Vercel Blob credentials configured" };
};

const UNCONFIGURED_MESSAGE =
  "Vercel Blob storage is not configured, and this deployment cannot use the filesystem. " +
  "Create a private Blob store, connect it to this project for the Production and Preview " +
  "environments, then redeploy. Connecting it provides VERCEL_OIDC_TOKEN and BLOB_STORE_ID; " +
  "alternatively add a BLOB_READ_WRITE_TOKEN. No data has been written.";

/**
 * Stands in for the Blob repository when Blob is required but not configured.
 *
 * It fails on reads as well as writes on purpose. Falling back to the
 * filesystem here would accept the request, write to a directory that is thrown
 * away after the invocation, and report a success that never happened.
 */
const unconfiguredBlobRepository: JsonRepository = {
  kind: BLOB,
  async readJson(): Promise<never> {
    throw new DataStoreError(UNCONFIGURED_MESSAGE, 500);
  },
  async writeJson(): Promise<never> {
    throw new DataStoreError(UNCONFIGURED_MESSAGE, 500);
  },
  async resetJson(): Promise<never> {
    throw new DataStoreError(UNCONFIGURED_MESSAGE, 500);
  },
  async existsJson(): Promise<never> {
    throw new DataStoreError(UNCONFIGURED_MESSAGE, 500);
  },
  async readInitialText(): Promise<never> {
    throw new DataStoreError(UNCONFIGURED_MESSAGE, 500);
  },
  async readInitialJson(): Promise<never> {
    throw new DataStoreError(UNCONFIGURED_MESSAGE, 500);
  },
};

let active: JsonRepository | null = null;
let activePlan: StoragePlan | null = null;

const build = (plan: StoragePlan): JsonRepository => {
  if (plan.kind === FILESYSTEM) return localRepository;
  return plan.configured ? vercelBlobRepository : unconfiguredBlobRepository;
};

/** The plan chosen for the current process, for logging and diagnostics. */
export const getStoragePlan = (): StoragePlan => {
  if (!activePlan) activePlan = resolveStoragePlan(process.env);
  return activePlan;
};

/**
 * The repository every server-side read and write goes through.
 *
 * Resolved once per process and cached, so the choice is stable for the life of
 * the process and the environment is inspected on the first request rather than
 * at module load.
 */
export const getJsonRepository = (): JsonRepository => {
  if (!active) {
    const plan = getStoragePlan();
    active = build(plan);
    console.info(`[bhuribhoj] JSON storage: ${active.kind} (${plan.reason})`);
  }
  return active;
};
