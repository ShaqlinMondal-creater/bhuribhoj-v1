import { appConfig } from "@/lib/config";
import { ApiError } from "@/lib/api/errors";
import { getToken } from "@/lib/auth/token";

type ClientOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

const inflight = new Map<string, Promise<unknown>>();

/**
 * Browser API client.
 * Calls the Laravel API directly (see appConfig.publicApiBase).
 * A second identical call while the first is still running shares that request,
 * so a dev remount does not hit the same address twice.
 */
export function apiClient<T>(path: string, options: ClientOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const key = `${method} ${path} ${options.body === undefined ? "" : JSON.stringify(options.body)}`;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const request = send<T>(path, { ...options, method }).finally(() => {
    if (inflight.get(key) === request) inflight.delete(key);
  });

  inflight.set(key, request);
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
