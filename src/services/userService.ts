import { getCollection, setCollection } from "@/data/memoryStore";
import {
  createRecordRequest,
  deleteRecordRequest,
  fetchCollection,
  updateRecordRequest,
} from "@/data/api";
import type { PublicUser, Role, User } from "@/types/user";

// THE USER SERVICE.
//
// There is no member service: users.json is the one collection of people, and a
// member is a user whose member_id is set. Lookups read the in-memory mirror, and
// every change POSTs or DELETEs against the record so the server writes it to
// disk and the change survives a refresh.
//
// The cached users are the redacted records the API returns, so a password is
// never in this file's data. Creating a user is the one path that sends a
// password, and the server hashes it before it is stored.

const getCachedUsers = (): PublicUser[] => getCollection<PublicUser[]>("users");

/** Replaces one user in the mirror with the record the server just saved. */
const mirrorUser = (saved: PublicUser) => {
  setCollection(
    "users",
    getCachedUsers().map((user) => (user.id === saved.id ? saved : user)),
  );
  return saved;
};

export const getUsers = (): PublicUser[] => getCachedUsers();

export const findUserById = (id: string): PublicUser | null =>
  getCachedUsers().find((user) => user.id === id) ?? null;

export const findUserByEmail = (email: string): PublicUser | null => {
  const needle = email.trim().toLowerCase();
  return getCachedUsers().find((user) => user.email.toLowerCase() === needle) ?? null;
};

/** The user a member_id belongs to, which is how meals resolve who ate. */
export const findUserByMemberId = (memberId: string): PublicUser | null =>
  getCachedUsers().find((user) => user.member_id === memberId) ?? null;

/** Every user who carries a member_id, i.e. the people a meal can be booked to. */
export const getMemberUsers = (): PublicUser[] =>
  getCachedUsers().filter((user) => user.member_id !== null);

/** Re-reads users.json from the server, so the mirror reflects a sign-in or a reset. */
export const refreshUsers = async (): Promise<PublicUser[]> => {
  const users = await fetchCollection<PublicUser[]>("users");
  setCollection("users", users);
  return users;
};

/** The value for a new record's id, so ids stay unique without a server round trip. */
export const nextUserId = (users: PublicUser[] = getCachedUsers()): string => {
  const highest = users.reduce((max, user) => {
    const match = /^USR(\d+)$/.exec(user.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `USR${String(highest + 1).padStart(3, "0")}`;
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
    id: nextUserId(),
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
  const publicUser = mirrorUser(redact(created));
  return publicUser;
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
    const current = findUserById(id);
    changes.member_id = current?.member_id ?? null;
  }

  const saved = await updateRecordRequest<User>("users", id, changes);
  return mirrorUser(redact(saved));
};

export const deleteUser = async (id: string) => {
  await deleteRecordRequest("users", id);
  setCollection(
    "users",
    getCachedUsers().filter((user) => user.id !== id),
  );
};

/** Keeps a password out of anything the browser holds, even if a record is echoed back. */
const redact = (user: User): PublicUser => {
  const publicUser = { ...user } as Partial<User>;
  delete publicUser.password;
  return publicUser as PublicUser;
};
