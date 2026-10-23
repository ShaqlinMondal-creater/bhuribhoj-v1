import { appConfig } from "@/lib/config";
import { ApiError } from "@/lib/api/errors";
import { getToken } from "@/lib/auth/token";

type ClientOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

const recentGets = new Map<string, { at: number; promise: Promise<unknown> }>();
const DEDUPE_MS = 800;

/**
 * Browser API client.
 * Calls same-origin /backend/*, which Next rewrites to the Laravel route.
 * The request and JSON response show in the browser Network tab.
 */
export function apiClient<T>(path: string, options: ClientOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  if (method !== "GET") recentGets.clear();
  const key = `${method} ${path}`;

  if (method === "GET") {
    const recent = recentGets.get(key);
    if (recent && Date.now() - recent.at < DEDUPE_MS) {
      return recent.promise as Promise<T>;
    }
  }

  const request = send<T>(path, options);
  if (method === "GET") recentGets.set(key, { at: Date.now(), promise: request });
  return request;
}

async function send<T>(path: string, options: ClientOptions): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${appConfig.publicApiBase}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const validation =
      payload?.errors && typeof payload.errors === "object"
        ? Object.values(payload.errors as Record<string, string[]>)
            .flat()
            .join(" ")
        : null;

    throw new ApiError(
      validation || payload?.message || payload?.error || `Request failed (${response.status})`,
      response.status,
      payload,
    );
  }

  return payload as T;
}
