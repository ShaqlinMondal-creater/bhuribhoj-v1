/**
 * App + API configuration.
 * Browser always calls same-origin `/backend` (no CORS).
 * Next rewrites that to the live Laravel API.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "BhuriBhoj",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /**
   * Same-origin proxy → live API (see next.config.ts LARAVEL_API_ORIGIN).
   */
  publicApiBase: process.env.NEXT_PUBLIC_API_BASE ?? "/backend",
} as const;

export const AUTH_COOKIE = {
  token: "bb_token",
  role: "bb_role",
} as const;
