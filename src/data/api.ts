// Client-side HTTP boundary.
//
// This is the only module in the frontend that talks to the server. Services
// and hooks call these helpers, so swapping the JSON file repository for a
// Laravel API later means changing the paths here, not the services, hooks or
// components.

import type { CollectionMeta, CollectionQuery } from "@/data/collections";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const base = "/api/data";

/** Turns a query object into the url the list endpoints understand. */
export const collectionPath = (collection: string, query?: CollectionQuery): string => {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.role) params.set("role", query.role);
  if (typeof query?.status === "boolean") params.set("status", String(query.status));
  if (query?.memberId) params.set("memberId", query.memberId);
  if (query?.today) params.set("today", query.today);
  if (typeof query?.page === "number") params.set("page", String(query.page));
  if (typeof query?.limit === "number") params.set("limit", String(query.limit));
  if (query?.summary) params.set("summary", query.summary);
  const search = params.toString();
  return search === "" ? `${base}/${collection}` : `${base}/${collection}?${search}`;
};

/**
 * Sends one request and hands back the whole response body.
 *
 * A non-2xx answer is always an error, so a rejected write is never reported as
 * a success. `data` and `meta` stay optional here because the sign-in endpoint
 * answers with a data-only envelope.
 */
const send = async (path: string, init?: RequestInit) => {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (error) {
    throw new ApiError(
      `Could not reach the data service: ${error instanceof Error ? error.message : "network error"}`,
      0,
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { data?: unknown; meta?: unknown; error?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.error ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return payload ?? {};
};

const request = async <T,>(path: string, init?: RequestInit): Promise<T> =>
  ((await send(path, init)).data) as T;

/**
 * Asks for one list, with the paging and counters that came back with it.
 *
 * The server does the search, the filtering and the slicing, so a view only
 * ever holds the rows it is showing plus the totals it needs for its footer.
 */
export const fetchCollectionPage = async <T,>(
  collection: string,
  query?: CollectionQuery,
): Promise<{ data: T; meta: CollectionMeta | null }> => {
  const payload = await send(collectionPath(collection, query));
  return { data: payload.data as T, meta: (payload.meta as CollectionMeta | undefined) ?? null };
};

export const fetchCollection = <T,>(collection: string, query?: CollectionQuery): Promise<T> =>
  fetchCollectionPage<T>(collection, query).then((page) => page.data);

/**
 * Asks the server to check a sign-in.
 *
 * The password goes to the server and the user comes back without one, so the
 * browser never holds a credential to compare. The response is the same shape as
 * the other calls, so the error handling above still reports a rejected sign-in.
 */
export const signInRequest = <T,>(email: string, password: string): Promise<T> =>
  request<T>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const fetchRecord = <T,>(collection: string, id: string): Promise<T> =>
  request<T>(`${base}/${collection}/${encodeURIComponent(id)}`);

export const createRecordRequest = <T,>(collection: string, record: unknown): Promise<T> =>
  request<T>(`${base}/${collection}`, { method: "POST", body: JSON.stringify({ record }) });

// Update convention: POST carries both creating a record and updating one, so an
// update is a POST to the record's own url. The url id identifies the record.
export const updateRecordRequest = <T,>(
  collection: string,
  id: string,
  patch: unknown,
): Promise<T> =>
  request<T>(`${base}/${collection}/${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ patch }),
  });

export const deleteRecordRequest = (collection: string, id: string): Promise<{ id: string }> =>
  request<{ id: string }>(`${base}/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" });

export const resetDataRequest = (): Promise<{ restored: string[] }> =>
  request<{ restored: string[] }>(`${base}/reset`, { method: "POST" });
