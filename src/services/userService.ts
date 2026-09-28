import { getCollection, setCollection } from "@/data/memoryStore";
import {
  createRecordRequest,
  deleteRecordRequest,
  fetchCollectionPage,
  fetchRecord,
  updateRecordRequest,
} from "@/data/api";
import type { CollectionMeta, CollectionQuery } from "@/data/collections";
import type { PublicUser, Role, User } from "@/types/user";

// THE USER SERVICE.
//
// There is no member service: users.json is the one collection of people, and a
// member is a user whose member_id is set.
//
// The complete users collection is never downloaded just to show the app. The
// browser asks for one page of it, with the search and filters applied on the
// server, and keeps only the individual records it has actually seen. Those
// records sit in the cache so a lookup by id is instant, but they are not the
// collection: a view that needs the whole thing asks the server for it.
//
// Every change POSTs or DELETEs against the record so the server writes it to
// disk and the change survives a refresh. The records the API returns are already
// redacted, so a password is never in this file's data, and creating a user is
// the one path that sends one - the server hashes it before it is stored.

/** Records the app has seen, keyed by nothing in particular: an overlay, not a list. */
const seenUsers = (): PublicUser[] => getCollection<PublicUser[]>("users");

const rememberUser = (user: PublicUser): PublicUser => {
  setCollection(
    "users",
    [...seenUsers().filter((row) => row.id !== user.id), user],
  );
  return user;
};

const rememberUsers = (users: PublicUser[]): PublicUser[] => {
  if (users.length === 0) return users;
  const merged = new Map(seenUsers().map((row) => [row.id, row]));
  users.forEach((row) => merged.set(row.id, row));
  setCollection("users", [...merged.values()]);
  return users;
};

const forgetUser = (id: string): void => {
  setCollection(
    "users",
    seenUsers().filter((row) => row.id !== id),
  );
};

/**
 * The id a new record should use.
 *
 * The server works it out from the whole collection and sends it back with every
 * page, so no client has to hold the list to be able to add to it. It is only
 * ever a hint for the next write: the server still rejects a duplicate.
 */
let nextIdHint: string | null = null;

const rememberMeta = (meta: CollectionMeta | null): void => {
  if (meta?.nextId) nextIdHint = meta.nextId;
};

/** Reads one page of users, filtered and searched by the server. */
export const queryUsers = async (
  query: CollectionQuery,
): Promise<{ data: PublicUser[]; meta: CollectionMeta | null }> => {
  const page = await fetchCollectionPage<PublicUser[]>("users", query);
  rememberMeta(page.meta);
  return { data: rememberUsers(page.data), meta: page.meta };
};

/** The lightweight totals the dashboard and the users table show. */
export const countUsers = async () => {
  const page = await fetchCollectionPage<{ total: number; active: number; entryFeePending: number }>(
    "users",
    { summary: "counts" },
  );
  rememberMeta(page.meta);
  return page.data;
};

/** One user by id, straight from the server, cached once it has been seen. */
export const loadUser = async (id: string): Promise<PublicUser | null> => {
  try {
    return rememberUser(await fetchRecord<PublicUser>("users", id));
  } catch {
    // A deleted user is not an error worth throwing about; the caller falls back
    // to whatever it already has.
    return null;
  }
};

/** A user the app already holds, without asking the server again. */
export const findUserById = (id: string): PublicUser | null =>
  seenUsers().find((user) => user.id === id) ?? null;

/** Caches a record the server has just handed back outside a list request. */
export const rememberSignedInUser = (user: PublicUser): PublicUser => rememberUser(user);

const ensureNextUserId = async (): Promise<string> => {
  if (nextIdHint) return nextIdHint;
  // Nobody has listed users in this tab yet, so ask for the smallest possible
  // page purely to learn the id the server would hand out next.
  await queryUsers({ page: 1, limit: 1 });
  return nextIdHint ?? "USR001";
};

export const createUser = async (input: {
  name: string;
  email: string;
  password?: string;
  role: Role;
  mobile?: string | null;
  address?: string | null;
  room?: string | null;
  joiningDate?: string | null;
  status?: boolean;
  member_id?: string | null;
  wallet_id?: number | null;
  deposite_amount?: number | null;
  entryFee?: number | null;
  entryFeeStatus?: "paid" | "pending" | null;
  entryFeePaidDate?: string | null;
  image_url?: string | null;
}) => {
  // A member_id only belongs to a member. Any other role has none, so the field
  // is stored as null rather than carrying a meaningless identifier.
  const memberId = input.role === "member" ? (input.member_id ?? null) : null;
  // A new user is the one record that is given a password, and it is hashed by
  // the server before it is stored. There is no update path for it.
  if (!input.password) throw new Error("A new user needs a password.");

  // A new user starts signed out: the login fields reflect the last sign-in, and
  // there has not been one yet.
  const record = {
    id: await ensureNextUserId(),
    member_id: memberId,
    name: input.name,
    email: input.email,
    password: input.password,
    mobile: input.mobile ?? null,
    address: input.address ?? null,
    room: input.room ?? null,
    joiningDate: input.joiningDate ?? null,
    status: input.status ?? true,
    role: input.role,
    wallet_id: input.wallet_id ?? null,
    deposite_amount: input.deposite_amount ?? null,
    entryFee: input.entryFee ?? null,
    entryFeeStatus: input.entryFeeStatus ?? null,
    entryFeePaidDate: input.entryFeePaidDate ?? null,
    image_url: input.image_url ?? null,
    login_status: false,
    login_at: null,
    logout_at: null,
  };

  const created = await createRecordRequest<User>("users", record);
  return rememberUser(redact(created));
};

export const updateUser = async (
  id: string,
  input: Partial<
    Pick<
      PublicUser,
      | "name"
      | "email"
      | "mobile"
      | "address"
      | "room"
      | "joiningDate"
      | "status"
      | "role"
      | "member_id"
      | "wallet_id"
      | "deposite_amount"
      | "entryFee"
      | "entryFeeStatus"
      | "entryFeePaidDate"
      | "image_url"
    >
  >,
) => {
  // The server's patch schema for users has no password, so an update can never
  // rewrite the stored hash. If a caller passes one it is dropped here rather
  // than being sent and rejected.
  const changes = { ...input } as Partial<PublicUser> & { password?: string };
  delete changes.password;

  // Dropping the member_id of a member would orphan the meals pointing at it, so
  // the role decides it instead: only a member carries one.
  if (changes.role && changes.role !== "member") changes.member_id = null;
  if (changes.role === "member" && changes.member_id === undefined) {
    const current = await loadUser(id);
    changes.member_id = current?.member_id ?? null;
  }

  const saved = await updateRecordRequest<User>("users", id, changes);
  return rememberUser(redact(saved));
};

export const deleteUser = async (id: string) => {
  await deleteRecordRequest("users", id);
  forgetUser(id);
};

/** Keeps a password out of anything the browser holds, even if a record is echoed back. */
const redact = (user: User): PublicUser => {
  const publicUser = { ...user } as Partial<User>;
  delete publicUser.password;
  return publicUser as PublicUser;
};
