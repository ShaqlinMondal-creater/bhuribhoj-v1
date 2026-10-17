import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/config";
import type { Role } from "@/types/auth";

const isProd = process.env.NODE_ENV === "production";

export async function setAuthCookies(token: string, role: Role) {
  const jar = await cookies();
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
  };

  jar.set(AUTH_COOKIE.token, token, { ...common, maxAge: 60 * 60 * 24 * 30 });
  jar.set(AUTH_COOKIE.role, role, { ...common, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE.token);
  jar.delete(AUTH_COOKIE.role);
}

export async function getAuthToken() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE.token)?.value ?? null;
}

export async function getAuthRole(): Promise<Role | null> {
  const jar = await cookies();
  const role = jar.get(AUTH_COOKIE.role)?.value;
  if (role === "admin" || role === "president" || role === "manager" || role === "member") {
    return role;
  }
  return null;
}
