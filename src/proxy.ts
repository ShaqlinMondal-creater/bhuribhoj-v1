import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/config";

/**
 * Next.js 16 Proxy — runs before pages render.
 * Protects /admin and /mess, and sends signed-in users away from /login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE.token)?.value;
  const role = request.cookies.get(AUTH_COOKIE.role)?.value;

  const isAdminArea = pathname.startsWith("/admin");
  const isMessArea = pathname.startsWith("/mess");
  const isLogin = pathname === "/login";

  if ((isAdminArea || isMessArea) && !token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Area access is decided by the live role in the layouts.
  // Checking bb_role here fights that and can loop /admin ↔ /mess.
  if (isLogin && token) {
    const dest = role === "admin" ? "/admin" : "/mess";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mess/:path*", "/login"],
};
