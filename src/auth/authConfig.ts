import type { Role } from "@/types/user";

export const SESSION_STORAGE_KEY = "bhuribhoj-demo-session";

export const FULL_ACCESS_ROLES: Role[] = ["admin", "manager", "president"];

export const hasFullAccess = (role: Role) => FULL_ACCESS_ROLES.includes(role);

export const isMember = (role: Role) => role === "member";

export const canManageMembers = (role: Role) => hasFullAccess(role);

export const roleLabels: Record<Role, string> = {
  admin: "Administrator",
  manager: "Manager",
  president: "President",
  member: "Member",
};