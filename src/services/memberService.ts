import { hasFullAccess } from "@/auth/authConfig";
import { getCollection, setCollection } from "@/data/memoryStore";
import { createRecordRequest, deleteRecordRequest, updateRecordRequest } from "@/data/api";
import { makeId } from "@/lib/ids";
import type { Member } from "@/types/member";
import type { Role } from "@/types/user";

export type MemberInput = Omit<Member, "id">;

// Reads stay synchronous: they come from the in-memory mirror of members.json,
// which is filled at start-up and refreshed after every write.
export const getMembers = (): Member[] => getCollection<Member[]>("members");

export const getMember = (id: string): Member | undefined =>
  getMembers().find((member) => member.id === id);

const assertCanManage = (role: Role) => {
  if (!hasFullAccess(role)) throw new Error("Only full-access roles can manage members.");
};

/** Writes members.json, then mirrors the server's record back into the cache. */
const applyToCache = (id: string, record: Member) => {
  const current = getMembers();
  setCollection(
    "members",
    current.some((member) => member.id === id)
      ? current.map((member) => (member.id === id ? record : member))
      : [...current, record],
  );
};

export const addMember = async (input: MemberInput, role: Role) => {
  assertCanManage(role);
  const member: Member = { ...input, id: makeId("MEM", getMembers().map((item) => item.id)) };
  const saved = await createRecordRequest<Member>("members", member);
  applyToCache(saved.id, saved);
  return saved;
};

export const updateMember = async (id: string, input: Partial<MemberInput>, role: Role) => {
  assertCanManage(role);
  const saved = await updateRecordRequest<Member>("members", id, input);
  applyToCache(saved.id, saved);
  return saved;
};

export const deactivateMember = (id: string, role: Role) =>
  updateMember(id, { status: "inactive" }, role);

export const deleteMember = async (id: string, role: Role) => {
  assertCanManage(role);
  await deleteRecordRequest("members", id);
  setCollection(
    "members",
    getMembers().filter((member) => member.id !== id),
  );
};
