"use server";

import { redirect } from "next/navigation";
import { homePathForRole, pathForSeat, safeNextPath } from "@/lib/auth/roles";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth/session";
import type { Role, SeatNext } from "@/types/auth";

/** Cookie gate only. The Laravel call already happened in the browser. */
export async function startSessionAction(token: string, role: Role, next: string, seat?: SeatNext) {
  await setAuthCookies(token, role);
  if (seat && seat !== "dashboard") {
    redirect(pathForSeat(seat, role));
  }
  redirect(safeNextPath(next, role) ?? (seat ? pathForSeat(seat, role) : homePathForRole(role)));
}

export async function clearSessionAction() {
  await clearAuthCookies();
}
