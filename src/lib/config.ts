/**
 * App + API configuration.
 * Works for local and production via env vars.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "BhuriBhoj",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /**
   * Browser calls the Laravel API directly.
   * Local proxy, off for now:
   * publicApiBase: "/backend",
   */
  publicApiBase: "https://bhuribhoj-api.liwaas.com/api",
} as const;

export const AUTH_COOKIE = {
  token: "bb_token",
  role: "bb_role",
} as const;
