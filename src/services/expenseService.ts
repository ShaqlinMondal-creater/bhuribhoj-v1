import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type ExpenseRow = {
  id: number;
  title: string;
  quantity?: string | number | null;
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
  quantity: string;
  amount: number;
  spent_on: string;
  note?: string;
};

export const expenseService = {
  fetch(role: Role, body: { category?: NewExpense["category"]; fund_type?: NewExpense["fund_type"]; from_date?: string; to_date?: string; search?: string } = {}) {
    return apiClient<ExpensesPayload>(`${doorFor(role)}/expenses/fetch`, { method: "POST", body });
  },
  create(role: Role, body: NewExpense) {
    return apiClient<{ message: string }>(`${doorFor(role)}/expenses/create`, { method: "POST", body });
  },
  update(role: Role, body: NewExpense & { id: number }) {
    return apiClient<{ message: string }>(`${doorFor(role)}/expenses/update`, { method: "POST", body });
  },
};
