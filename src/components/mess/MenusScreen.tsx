"use client";

import { useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { fieldClass, panelCard } from "@/components/ui/classes";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { menuService } from "@/services/menuService";

export function MenusScreen() {
  const user = useMessUser();
  const canSave = user?.role === "president" || user?.role === "manager";
  const menus = useApi(() => menuService.fetch(user?.role ?? "member"), Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const table = useClientPage(menus.data?.data ?? []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !canSave) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await menuService.save(user.role, {
        menu_date: String(data.get("menu_date") ?? ""),
        meal_type: String(data.get("meal_type") ?? "lunch") as "lunch" | "dinner",
        dishes: String(data.get("dishes") ?? ""),
      });
      form.reset();
      setDone(result.message);
      menus.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the menu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Mess Details" title="Meals" description="Lunch and dinner menus for this mess." />
      {menus.error || error ? <Notice>{error || menus.error}</Notice> : null}
      {done ? <p className="text-sm text-emerald-800">{done}</p> : null}
      {canSave ? (
        <form onSubmit={onSubmit} className={panelCard}>
          <h2 className="text-sm font-semibold text-stone-900">Save a menu</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-stone-600">
              Date
              <input name="menu_date" type="date" required className={fieldClass} />
            </label>
            <label className="block text-sm text-stone-600">
              Meal
              <select name="meal_type" defaultValue="lunch" className={fieldClass}>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </label>
            <label className="block text-sm text-stone-600 sm:col-span-2">
              Dishes
              <input name="dishes" required className={fieldClass} placeholder="Rice, dal, fish curry" />
            </label>
          </div>
          <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
            {pending ? "Saving…" : "Save menu"}
          </button>
        </form>
      ) : null}
      <TableShell
        count={table.count}
        limit={table.limit}
        offset={table.offset}
        onLimit={table.setLimit}
        onOffset={table.setOffset}
        head={
          <tr>
            <th className={thClass()}>Meal</th>
            <th className={thClass()}>Date</th>
            <th className={thClass()}>Dishes</th>
          </tr>
        }
      >
        <TableStatus colSpan={3} loading={menus.loading} empty={!menus.loading && table.count === 0 ? "No meals yet." : null} />
        {table.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium capitalize text-stone-950">{row.meal_type}</td>
            <td className="px-4 py-3 text-stone-600">{row.menu_date}</td>
            <td className="px-4 py-3 text-stone-700">{row.dishes}</td>
          </tr>
        ))}
      </TableShell>
    </section>
  );
}
