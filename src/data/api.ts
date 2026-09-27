// Client-side HTTP boundary.
//
// This is the only module in the frontend that talks to the server. Services
// call these helpers, so swapping the JSON file repository for a Laravel API
// later means changing the paths here, not the services, hooks or components.

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const base = "/api/data";

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
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
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    // A failed write is never reported as a success.
    throw new ApiError(payload?.error ?? `Request failed with status ${response.status}.`, response.status);
  }

  return payload?.data as T;
};

export const fetchCollection = <T,>(collection: string): Promise<T> =>
  request<T>(`${base}/${collection}`);

export const fetchRecord = <T,>(collection: string, id: string): Promise<T> =>
  request<T>(`${base}/${collection}/${encodeURIComponent(id)}`);

export const createRecordRequest = <T,>(collection: string, record: unknown): Promise<T> =>
  request<T>(`${base}/${collection}`, { method: "POST", body: JSON.stringify({ record }) });

export const updateRecordRequest = <T,>(
  collection: string,
  id: string,
  patch: unknown,
): Promise<T> =>
  request<T>(`${base}/${collection}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });

export const deleteRecordRequest = (collection: string, id: string): Promise<{ id: string }> =>
  request<{ id: string }>(`${base}/${collection}/${encodeURIComponent(id)}`, { method: "DELETE" });

export const resetDataRequest = (): Promise<{ restored: string[] }> =>
  request<{ restored: string[] }>(`${base}/reset`, { method: "POST" });
