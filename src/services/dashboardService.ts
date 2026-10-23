import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { LaravelUser, Role } from "@/types/auth";

export type DashboardPayload = {
  user: LaravelUser;
  platform?: {
    mess_count: number;
    user_count: number;
    active_mess_count: number;
  } | null;
  mess_totals: {
    total_deposit: number;
    total_expense: number;
    manager_fund: number;
    mess_fund: number;
    balance: number;
  } | null;
  my_totals: {
    total_deposit: number;
  } | null;
};

export const dashboardService = {
  fetch(role: Role) {
    return apiClient<DashboardPayload>(`${doorFor(role)}/dashboard/fetch`, { method: "POST", body: {} });
  },
};
