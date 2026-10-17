/**
 * App + API configuration.
 * Works for local and production via env vars.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "BhuriBhoj",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** Browser path proxied by Next rewrites → Laravel /api */
  publicApiBase: process.env.NEXT_PUBLIC_API_BASE ?? "/backend",
} as const;

/** Absolute Laravel API base used only on the server. */
export function getLaravelApiBase(): string {
  const origin = process.env.LARAVEL_API_ORIGIN ?? "http://127.0.0.1:8000";
  return `${origin.replace(/\/$/, "")}/api`;
}

export const AUTH_COOKIE = {
  token: "bb_token",
  role: "bb_role",
} as const;
