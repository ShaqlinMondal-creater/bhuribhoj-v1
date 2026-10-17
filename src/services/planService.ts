import { apiClient } from "@/lib/api/client";
import type { Plan } from "@/types/auth";

export const planService = {
  fetch() {
    return apiClient<{ data: Plan[] }>("/plans/fetch", { auth: false });
  },
};
