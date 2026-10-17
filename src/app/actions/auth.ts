"use server";

import { redirect } from "next/navigation";
import { homePathForRole, safeNextPath } from "@/lib/auth/roles";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import type { Role } from "@/types/auth";

/** Cookie gate only. The Laravel call already happened in the browser. */
export async function startSessionAction(token: string, role: Role, next: string) {
  await setAuthCookies(token, role);
  redirect(safeNextPath(next, role) ?? homePathForRole(role));
}

export async function clearSessionAction() {
  await clearAuthCookies();
}
