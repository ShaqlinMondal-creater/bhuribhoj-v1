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

export const expenseService = {
  fetch() {
    return apiClient<ExpensesPayload>("/expenses/fetch");
  },
};
