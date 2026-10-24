"use client";

import { useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { fieldClass, panelCard } from "@/components/ui/classes";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { expenseService, type NewExpense } from "@/services/expenseService";
import type { Role } from "@/types/auth";

export function ExpensesScreen() {
  const user = useMessUser();
  const canRecord = user?.role === "president" || user?.role === "manager";
  const { data, error, loading, reload } = useApi(() => expenseService.fetch(user?.role ?? "member"), Boolean(user));
  const table = useClientPage(data?.data ?? []);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Expenses"
        description={data ? `Recorded total ${inr(data.total_amount)}` : "Market, constant, feast, and tour spending."}
      />
      {canRecord && user ? <ExpenseForm role={user.role} onCreated={reload} /> : null}
      {error ? <Notice>{error}</Notice> : null}
      <TableShell
        count={table.count}
        limit={table.limit}
        offset={table.offset}
        onLimit={table.setLimit}
        onOffset={table.setOffset}
        head={
          <tr>
            <th className={thClass()}>Title</th>
            <th className={thClass()}>Category</th>
            <th className={thClass()}>Date</th>
            <th className={thClass("right")}>Amount</th>
          </tr>
        }
      >
        <TableStatus colSpan={4} loading={loading} empty={!loading && table.count === 0 ? "No expenses yet." : null} />
        {table.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium text-stone-950">{row.title}</td>
            <td className="px-4 py-3 capitalize text-stone-600">{row.category}</td>
            <td className="px-4 py-3 text-stone-600">{row.spent_on}</td>
            <td className="px-4 py-3 text-right font-semibold text-stone-900">{inr(Number(row.amount))}</td>
          </tr>
        ))}
      </TableShell>
    </section>
  );
}

function ExpenseForm({ role, onCreated }: { role: Role; onCreated: () => void }) {
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
      const result = await expenseService.create(role, body);
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
    <form onSubmit={onSubmit} className={panelCard}>
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
