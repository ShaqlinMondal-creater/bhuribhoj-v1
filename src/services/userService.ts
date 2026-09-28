import { getCollection, setCollection } from "@/data/memoryStore";
import { updateRecordRequest } from "@/data/api";
import type { DemoUser } from "@/auth/authTypes";
import type { User } from "@/types/user";

// users.json is the persistent account file. Lookups read the in-memory mirror;
// a profile edit POSTs to the record so the change is written to disk and
// survives a refresh. The server rejects any attempt to change the password
// through this path.
const getDemoUsers = (): DemoUser[] => getCollection<DemoUser[]>("users");

const toPublicUser = (user: DemoUser): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.memberId ? { memberId: user.memberId } : {}),
});

export const getUsers = (): User[] => getDemoUsers().map(toPublicUser);

export const findUserById = (id: string): DemoUser | null =>
  getDemoUsers().find((user) => user.id === id) ?? null;

export const findUserByEmail = (email: string): DemoUser | null => {
  const needle = email.trim().toLowerCase();
  return getDemoUsers().find((user) => user.email.toLowerCase() === needle) ?? null;
};

export const updateUser = async (
  id: string,
  input: Partial<Pick<DemoUser, "name" | "email" | "mobile" | "avatarUrl">>,
) => {
  const saved = await updateRecordRequest<DemoUser>("users", id, input);
  setCollection(
    "users",
    getDemoUsers().map((user) => (user.id === saved.id ? saved : user)),
  );
  return saved;
};
