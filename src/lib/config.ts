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

/** Absolute Laravel API base used only on the server. */
export function getLaravelApiBase(): string {
  // Local, off for now:
  // const origin = process.env.LARAVEL_API_ORIGIN ?? "http://127.0.0.1:8000";
  const origin = process.env.LARAVEL_API_ORIGIN ?? "https://bhuribhoj-api.liwaas.com";
  return `${origin.replace(/\/$/, "")}/api`;
}

export const AUTH_COOKIE = {
  token: "bb_token",
  role: "bb_role",
} as const;
