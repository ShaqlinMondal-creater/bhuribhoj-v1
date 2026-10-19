import { apiClient } from "@/lib/api/client";

export type MonthManager = {
  id: number;
  month: string;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email?: string;
    member_code?: string | null;
    role?: string;
    status?: string;
  } | null;
};

export type ManagersPayload = {
  month: string;
  max: number;
  count: number;
  data: MonthManager[];
};

export const managerService = {
  fetch(month?: string) {
    return apiClient<ManagersPayload>("/managers/fetch", {
      method: "POST",
      body: month ? { month } : {},
    });
  },
  assign(userId: number, month: string) {
    return apiClient<{ message: string }>("/managers/assign", {
      method: "POST",
      body: { user_id: userId, month },
    });
  },
  remove(id: number) {
    return apiClient<{ message: string }>(`/managers/${id}/remove`, { method: "DELETE" });
  },
};
