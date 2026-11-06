const STORAGE_KEY = "bhuribhoj-admin-mess-id";

export function readAdminMessId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function writeAdminMessId(id: number | null) {
  if (typeof window === "undefined") return;
  if (id == null) window.localStorage.removeItem(STORAGE_KEY);
  else window.localStorage.setItem(STORAGE_KEY, String(id));
}

export function withMessId<T extends Record<string, unknown>>(body: T, messId?: number | null): T & { mess_id?: number } {
  if (!messId) return body;
  return { ...body, mess_id: messId };
}

export function messQuery(messId?: number | null) {
  return messId ? `?mess_id=${messId}` : "";
}
