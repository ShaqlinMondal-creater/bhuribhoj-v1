import { apiClient } from "@/lib/api/client";

export type LogRow = {
  id: number;
  actor_id: number | null;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  mess_id: number | null;
  message: string;
  meta: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  actor?: { id: number; name: string; email: string } | null;
  mess?: { id: number; name: string; code: string } | null;
};

export type LogQuery = {
  search?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
  limit: number;
  offset: number;
};

export const logService = {
  fetch(query: LogQuery) {
    return apiClient<{ data: LogRow[]; count: number; limit: number; offset: number; actions?: string[] }>(
      "/admin/logs/fetch",
      {
        method: "POST",
        body: query,
      },
    );
  },
};
