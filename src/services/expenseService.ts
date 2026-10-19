import { apiClient } from "@/lib/api/client";

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
  fetch() {
    return apiClient<ExpensesPayload>("/expenses/fetch", { method: "POST", body: {} });
  },
  create(body: NewExpense) {
    return apiClient<{ message: string }>("/expenses/create", { method: "POST", body });
  },
};
