"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { expenseService } from "@/services/expenseService";

export function ExpensesScreen() {
  const { data, error, loading } = useApi(expenseService.fetch);
  const rows = data?.data ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Expenses"
        description={data ? `Recorded total ${inr(data.total_amount)}` : "Market, constant, feast, and tour spending."}
      />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState icon="wallet" title="No expenses yet" description="New expense entries will list here." />
      ) : null}
      {rows.length > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5 last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-900">{row.title}</p>
                <p className="text-xs capitalize text-stone-500">
                  {row.category} · {row.spent_on}
                </p>
              </div>
              <p className="text-sm font-semibold text-stone-900">{inr(Number(row.amount))}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
