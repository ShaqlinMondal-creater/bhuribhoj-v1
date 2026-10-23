"use client";

import { useMessUser } from "@/components/auth/MessSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import { mealService } from "@/services/mealService";

export function MealsScreen() {
  const user = useMessUser();
  const { data, error, loading } = useApi(() => mealService.fetch(user?.role ?? "member"), Boolean(user));

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Kitchen"
        title="Daily meals"
        description={data ? `Meal date ${data.meal_date}` : "Lunch and dinner for today."}
      />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-28 animate-pulse rounded-2xl bg-white" /> : null}
      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Lunch on" value={data.summary.lunch_active} icon="meals" />
          <StatCard label="Lunch taken" value={data.summary.lunch_taken} icon="meals" />
          <StatCard label="Dinner on" value={data.summary.dinner_active} icon="meals" />
          <StatCard label="Dinner taken" value={data.summary.dinner_taken} icon="meals" />
        </div>
      ) : null}
      {!loading && !error && (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon="meals"
          title="No meals marked"
          description="Today's lunch and dinner rows will show here after they are saved."
        />
      ) : null}
      {(data?.data.length ?? 0) > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {data?.data.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5 last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-900">{row.user?.name ?? "Member"}</p>
                <p className="text-xs text-stone-500">{row.user?.member_code ?? "—"}</p>
              </div>
              <p className="text-xs text-stone-600">
                Lunch {row.lunch_taken ? "taken" : row.lunch_active ? "on" : "off"} · Dinner{" "}
                {row.dinner_taken ? "taken" : row.dinner_active ? "on" : "off"}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
