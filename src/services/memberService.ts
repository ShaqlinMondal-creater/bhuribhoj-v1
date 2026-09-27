import members from "@/data/json/members.json";
import { hasFullAccess } from "@/auth/authConfig";
import { makeId, nowIso, readCollection, STORAGE_KEYS, writeCollection } from "@/lib/prototypeStorage";
import type { Member } from "@/types/member";
import type { Role } from "@/types/user";

const seed = members as Member[];

export type MemberInput = Omit<Member, "id">;

export const getMembers = (): Member[] => readCollection(STORAGE_KEYS.members, seed);

const assertCanManage = (role: Role) => {
	if (!hasFullAccess(role)) throw new Error("Only full-access roles can manage members.");
};

export const addMember = (input: MemberInput, role: Role) => {
	assertCanManage(role);
	const current = getMembers();
	const member: Member = { ...input, id: makeId("MEM", current.map((item) => item.id)) };
	writeCollection(STORAGE_KEYS.members, [...current, member]);
	return member;
};

export const updateMember = (id: string, input: Partial<MemberInput>, role: Role) => {
	assertCanManage(role);
	const updated = getMembers().map((member) => member.id === id ? { ...member, ...input } : member);
	writeCollection(STORAGE_KEYS.members, updated);
	return updated.find((member) => member.id === id) ?? null;
};

export const deactivateMember = (id: string, role: Role) => updateMember(id, { status: "inactive" }, role);