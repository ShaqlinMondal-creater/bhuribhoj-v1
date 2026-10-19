"use client";

import { useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { expenseService, type NewExpense } from "@/services/expenseService";

export function ExpensesScreen() {
  const user = useMessUser();
  const canRecord = user?.role === "president" || user?.role === "manager";
  const { data, error, loading, reload } = useApi(expenseService.fetch);
  const rows = data?.data ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Expenses"
        description={data ? `Recorded total ${inr(data.total_amount)}` : "Market, constant, feast, and tour spending."}
      />
      {canRecord ? <ExpenseForm onCreated={reload} /> : null}
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

function ExpenseForm({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body: NewExpense = {
      title: String(data.get("title") ?? ""),
      amount: Number(data.get("amount")),
      spent_on: String(data.get("spent_on") ?? ""),
      category: String(data.get("category") ?? "market") as NewExpense["category"],
      fund_type: String(data.get("fund_type") ?? "manager_fund") as NewExpense["fund_type"],
      note: String(data.get("note") ?? "") || undefined,
    };
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await expenseService.create(body);
      form.reset();
      setDone(result.message);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the expense.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
      <h2 className="text-sm font-semibold text-stone-900">Record an expense</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-stone-600">
          Title
          <input name="title" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Amount
          <input name="amount" type="number" min="0" step="0.01" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Date
          <input name="spent_on" type="date" required className={fieldClass} />
        </label>
        <label className="block text-sm text-stone-600">
          Category
          <select name="category" defaultValue="market" className={fieldClass}>
            <option value="market">Market</option>
            <option value="constant">Constant</option>
            <option value="feast">Feast</option>
            <option value="tour">Tour</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm text-stone-600">
          Fund
          <select name="fund_type" defaultValue="manager_fund" className={fieldClass}>
            <option value="manager_fund">Manager fund</option>
            <option value="mess_fund">Mess fund</option>
          </select>
        </label>
        <label className="block text-sm text-stone-600">
          Note
          <input name="note" className={fieldClass} />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-emerald-800">{done}</p> : null}
      <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
        {pending ? "Saving…" : "Save expense"}
      </button>
    </form>
  );
}

const fieldClass = "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700";
