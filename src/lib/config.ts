/**
 * App + API configuration.
 * Works for local and production via env vars.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "BhuriBhoj",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /**
   * Browser API base.
   * Local default: `/backend` (Next rewrite → LARAVEL_API_ORIGIN/api).
   * Production may use the same proxy, or a full API URL.
   */
  publicApiBase: process.env.NEXT_PUBLIC_API_BASE ?? "/backend",
} as const;

export const AUTH_COOKIE = {
  token: "bb_token",
  role: "bb_role",
} as const;
