import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// PASSWORD HASHING - SERVER SIDE ONLY.
//
// A stored password is never a readable password. This module is the only place
// a password is turned into (or checked against) what is kept on disk, and it is
// server-only, so the browser never hashes, compares or holds a credential.
//
// The algorithm is scrypt from node:crypto, which is a memory-hard key
// derivation function and is already part of the runtime, so nothing extra is
// added to the dependency tree. Each hash carries its own random salt and the
// cost parameters it was created with, so the cost can be raised later without
// invalidating the passwords already stored.
//
// Stored form:  scrypt$<N>$<r>$<p>$<saltHex>$<derivedKeyHex>
//
// The parameters live inside the hash, so verifying a record created with
// different settings still works.

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem?: number },
) => Promise<Buffer>;

const ALGORITHM = "scrypt";
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELISM = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
// scrypt needs roughly 128 * N * r bytes; give it headroom so a future, more
// expensive COST is not rejected by the default maxmem.
const MAX_MEMORY = 64 * 1024 * 1024;

/** Hashes a plaintext password for storage. */
export const hashPassword = async (plaintext: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(plaintext, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: MAX_MEMORY,
  });
  return [
    ALGORITHM,
    COST,
    BLOCK_SIZE,
    PARALLELISM,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
};

/** True when `plaintext` is the password behind an already-stored hash. */
export const verifyPassword = async (plaintext: string, stored: string): Promise<boolean> => {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== ALGORITHM) return false;

  const [, rawN, rawR, rawP, saltHex, keyHex] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const expected = Buffer.from(keyHex, "hex");
  if (expected.length === 0) return false;

  let derived: Buffer;
  try {
    derived = await scrypt(plaintext, Buffer.from(saltHex, "hex"), expected.length, {
      N,
      r,
      p,
      maxmem: MAX_MEMORY,
    });
  } catch {
    return false;
  }

  // Constant-time compare, so a wrong password cannot be found byte by byte.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
};
