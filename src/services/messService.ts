import { apiClient } from "@/lib/api/client";
import type { MessRecord } from "@/lib/api/mess";

export const messService = {
  fetch() {
    return apiClient<{ data?: MessRecord[] } | MessRecord>("/messes/fetch");
  },
};
