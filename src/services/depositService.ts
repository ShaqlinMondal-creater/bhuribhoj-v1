import { apiClient } from "@/lib/api/client";
import { doorFor } from "@/lib/api/door";
import type { Role } from "@/types/auth";

export type DepositPerson = { id: number; name: string; email?: string; member_code?: string | null; role?: string };

export type DepositRow = {
  id: number;
  user_id: number;
  fund_type: string;
  deposit_type: string;
  amount: string | number;
  deposited_on: string;
  for_month?: string | null;
  note?: string | null;
  user?: DepositPerson | null;
  added_by?: DepositPerson | number | null;
};

export type DepositQuery = {
  user_id?: number;
  search?: string;
  fund_type?: string;
  deposit_type?: string;
  for_month?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
};

export type DepositWrite = {
  user_id: number;
  fund_type: "mess_fund" | "manager_fund";
  deposit_type: "join" | "monthly" | "extra";
  amount: number;
  deposited_on: string;
  for_month?: string | null;
  note?: string | null;
};

type DepositsPage = {
  total_amount: number;
  data: DepositRow[];
  count: number;
  limit: number;
  offset: number;
};

export const depositService = {
  fetch(role: Role, query: DepositQuery = {}) {
    const body: DepositQuery = {
      limit: query.limit ?? 10,
      offset: query.offset ?? 0,
    };
    if (query.user_id) body.user_id = query.user_id;
    if (query.search) body.search = query.search;
    if (query.fund_type) body.fund_type = query.fund_type;
    if (query.deposit_type) body.deposit_type = query.deposit_type;
    if (query.for_month) body.for_month = query.for_month;
    if (query.from_date) body.from_date = query.from_date;
    if (query.to_date) body.to_date = query.to_date;
    return apiClient<DepositsPage>(`${doorFor(role)}/deposits/fetch`, { method: "POST", body });
  },
  create(role: Role, body: DepositWrite) {
    return apiClient<{ message: string; data: DepositRow }>(`${doorFor(role)}/deposits/create`, { method: "POST", body });
  },
  update(role: Role, body: DepositWrite & { id: number }) {
    return apiClient<{ message: string; data: DepositRow }>(`${doorFor(role)}/deposits/update`, { method: "POST", body });
  },
  remove(role: Role, id: number) {
    return apiClient<{ message: string }>(`${doorFor(role)}/deposits/${id}/delete`, { method: "DELETE" });
  },
  async fetchAll(role: Role) {
    const limit = 100;
    let offset = 0;
    const rows: DepositRow[] = [];
    let count = 0;

    do {
      const page = await apiClient<DepositsPage>(`${doorFor(role)}/deposits/fetch`, {
        method: "POST",
        body: { limit, offset },
      });
      rows.push(...page.data);
      count = page.count;
      offset += limit;
    } while (offset < count);

    return rows;
  },
};
