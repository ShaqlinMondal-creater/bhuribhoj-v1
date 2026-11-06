import { apiClient } from "@/lib/api/client";

export type ConfigRow = {
  id: number;
  config_key: string;
  config_value: string | null;
  note: string | null;
  updated_by: number | null;
  updater?: { id: number; name: string } | null;
  updated_at?: string;
};

export type ConfigQuery = {
  search?: string;
  limit: number;
  offset: number;
};

export type ConfigWrite = {
  config_key: string;
  config_value?: string | null;
  note?: string | null;
};

export const configService = {
  fetch(query: ConfigQuery) {
    return apiClient<{ data: ConfigRow[]; count: number; limit: number; offset: number }>("/admin/configs/fetch", {
      method: "POST",
      body: query,
    });
  },
  save(body: ConfigWrite) {
    return apiClient<{ message: string; data: ConfigRow }>("/admin/configs/save", { method: "POST", body });
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/admin/configs/${id}/delete`, { method: "DELETE" });
  },
};
