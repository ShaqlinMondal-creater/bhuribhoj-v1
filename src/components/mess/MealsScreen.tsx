"use client";

import { useMessUser } from "@/components/auth/MessSession";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import { mealService } from "@/services/mealService";

export function MealsScreen() {
  const user = useMessUser();
  const { data, error, loading } = useApi(() => mealService.fetch(user?.role ?? "member"), Boolean(user));
  const table = useClientPage(data?.data ?? []);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Mess Details"
        title="Daily Meals"
        description={data ? `Meal date ${data.meal_date}` : "Lunch and dinner for today."}
      />
      {error ? <Notice>{error}</Notice> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Lunch on" value={data.summary.lunch_active} icon="meals" />
          <StatCard label="Lunch taken" value={data.summary.lunch_taken} icon="meals" />
          <StatCard label="Dinner on" value={data.summary.dinner_active} icon="meals" />
          <StatCard label="Dinner taken" value={data.summary.dinner_taken} icon="meals" />
        </div>
      ) : null}
      <TableShell
        count={table.count}
        limit={table.limit}
        offset={table.offset}
        onLimit={table.setLimit}
        onOffset={table.setOffset}
        head={
          <tr>
            <th className={thClass()}>Member</th>
            <th className={thClass()}>Code</th>
            <th className={thClass()}>Lunch</th>
            <th className={thClass()}>Dinner</th>
          </tr>
        }
      >
        <TableStatus colSpan={4} loading={loading} empty={!loading && table.count === 0 ? "No meals marked." : null} />
        {table.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium text-stone-950">{row.user?.name ?? "Member"}</td>
            <td className="px-4 py-3 text-stone-600">{row.user?.member_code ?? "—"}</td>
            <td className="px-4 py-3 text-stone-600">{row.lunch_taken ? "Taken" : row.lunch_active ? "On" : "Off"}</td>
            <td className="px-4 py-3 text-stone-600">{row.dinner_taken ? "Taken" : row.dinner_active ? "On" : "Off"}</td>
          </tr>
        ))}
      </TableShell>
    </section>
  );
}
