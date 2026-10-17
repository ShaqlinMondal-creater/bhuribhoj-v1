import { apiClient } from "@/lib/api/client";
import type { LaravelUser } from "@/types/auth";

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
    guest_meals_amount: number;
    pending_fines: number;
    pending_dues: unknown[];
  } | null;
};

export const dashboardService = {
  fetch() {
    return apiClient<DashboardPayload>("/dashboard/fetch");
  },
};
