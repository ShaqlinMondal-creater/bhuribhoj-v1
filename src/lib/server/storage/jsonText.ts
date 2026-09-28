import "server-only";

import { DataStoreError } from "@/lib/server/storage/types";

// Shared JSON encode/decode for both repository implementations, so a malformed
// document is always reported the same way no matter which store holds it.

export const parseJson = <T,>(raw: string, file: string): T => {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new DataStoreError(
      `Could not parse ${file}: ${error instanceof Error ? error.message : "invalid JSON"}`,
      500,
    );
  }
};

/**
 * Serialises a value for storage. Two-space indentation and a trailing newline
 * match the committed JSON files, so a write never produces a noisy diff.
 */
export const serializeJson = (value: unknown, file: string): string => {
  let text: string | undefined;
  try {
    text = JSON.stringify(value, null, 2);
  } catch (error) {
    // A circular structure would otherwise throw a bare TypeError.
    throw new DataStoreError(
      `Could not serialize ${file}: ${error instanceof Error ? error.message : "value is not serializable"}`,
      500,
    );
  }
  if (text === undefined) {
    throw new DataStoreError(`Could not serialize ${file}: value is not serializable.`, 500);
  }
  return `${text}\n`;
};
