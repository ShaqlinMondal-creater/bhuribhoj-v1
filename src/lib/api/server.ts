import { getLaravelApiBase } from "@/lib/config";
import { getAuthToken } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";

type ApiOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  token?: string | null;
  auth?: boolean;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

/**
 * Server-side Laravel API client.
 * Uses LARAVEL_API_ORIGIN so local + production both work without CORS.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    cache,
    next,
  } = options;

  const headers = new Headers({
    Accept: "application/json",
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = options.token ?? (await getAuthToken());
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${getLaravelApiBase()}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: cache ?? (next?.revalidate != null ? undefined : "no-store"),
      next,
    });
  } catch (error) {
    throw new ApiError(
      `API unreachable: ${error instanceof Error ? error.message : "network error"}`,
      0,
    );
  }

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
