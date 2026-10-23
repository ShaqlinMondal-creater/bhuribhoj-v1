import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type ExpenseRow = {
  id: number;
  title: string;
  category: string;
  fund_type: string;
  amount: string | number;
  spent_on: string;
  note?: string | null;
};

export type ExpensesPayload = {
  total_amount: number;
  data: ExpenseRow[];
};

export type NewExpense = {
  fund_type: "mess_fund" | "manager_fund";
  category: "market" | "constant" | "feast" | "tour" | "other";
  title: string;
  amount: number;
  spent_on: string;
  note?: string;
};

export const expenseService = {
  fetch(role: Role) {
    return apiClient<ExpensesPayload>(`${doorFor(role)}/expenses/fetch`, { method: "POST", body: {} });
  },
  create(role: Role, body: NewExpense) {
    return apiClient<{ message: string }>(`${doorFor(role)}/expenses/create`, { method: "POST", body });
  },
};
