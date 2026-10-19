import { apiClient } from "@/lib/api/client";

export type DepositRow = {
  id: number;
  user_id: number;
  fund_type: string;
  deposit_type: string;
  amount: string | number;
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
  async fetchAll() {
    const limit = 100;
    let offset = 0;
    const rows: DepositRow[] = [];
    let count = 0;

    do {
      const page = await apiClient<DepositsPage>("/deposits/fetch", {
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
