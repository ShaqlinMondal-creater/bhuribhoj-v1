import type { Role } from "@/types/auth";

export function doorFor(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "president") return "/president";
  if (role === "manager") return "/manager";
  return "/member";
}
