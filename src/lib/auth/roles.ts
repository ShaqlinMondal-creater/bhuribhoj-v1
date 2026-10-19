import type { Role, SeatNext } from "@/types/auth";

export const MESS_ROLES: Role[] = ["president", "manager", "member"];

export function isAdmin(role: Role) {
  return role === "admin";
}

export function isMessRole(role: Role) {
  return MESS_ROLES.includes(role);
}

export function isPresident(role: Role | null | undefined) {
  return role === "president";
}

export function homePathForRole(role: Role) {
  if (role === "admin") return "/admin";
  return "/mess";
}

export function pathForSeat(seat: SeatNext, role: Role) {
  if (seat === "admin" || role === "admin") return "/admin";
  if (seat === "plans") return "/mess/plans";
  if (seat === "mess_setup") return "/mess/setup";
  return "/mess";
}

/** Only allow a same-area return path. Anything else falls back to home. */
export function safeNextPath(next: string, role: Role) {
  if (!next.startsWith("/") || next.startsWith("//")) return null;

  const home = homePathForRole(role);
  if (next === home || next.startsWith(`${home}/`)) return next;
  return null;
}

export const roleLabel: Record<Role, string> = {
  admin: "Platform Admin",
  president: "President",
  manager: "Manager",
  member: "Member",
};
