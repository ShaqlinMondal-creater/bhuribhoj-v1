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
    deposit_change?: number | null;
    expense_change?: number | null;
    balance_change?: number | null;
  } | null;
  chart?: { label: string; date?: string; deposits: number; mine?: number; expenses: number; balance?: number; meals?: number }[];
  activity?: { kind: "deposit" | "expense"; date: string; title: string; amount: number }[];
  my_totals: {
    total_deposit: number;
    month_deposit?: number;
    total_meals?: number;
    month_meals?: number;
    today?: { meal: string; label: string; on: boolean }[];
  } | null;
};

export const dashboardService = {
  fetch(role: Role, range?: { from_date?: string; to_date?: string }) {
    return apiClient<DashboardPayload>(`${doorFor(role)}/dashboard/fetch`, {
      method: "POST",
      body: range?.from_date && range.to_date ? range : {},
    });
  },
};
