"use client";

import { useMessUser } from "@/components/auth/MessSession";
import { Notice } from "@/components/ui/Notice";
import { StatCard } from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { dashboardService } from "@/services/dashboardService";

export function DashboardScreen() {
  const user = useMessUser();
  const { data, error, loading } = useApi(() => dashboardService.fetch(user?.role ?? "member"), Boolean(user));

  return (
    <section className="space-y-6">
      <p className="max-w-2xl text-sm leading-6 text-stone-500">
        Deposits, expenses, and your own balance for this mess.
      </p>
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-28 animate-pulse rounded-2xl bg-white" /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mess deposits" value={inr(data?.mess_totals?.total_deposit)} icon="wallet" />
        <StatCard label="Mess expenses" value={inr(data?.mess_totals?.total_expense)} icon="meals" />
        <StatCard label="Balance" value={inr(data?.mess_totals?.balance)} icon="grid" />
        <StatCard label="My deposits" value={inr(data?.my_totals?.total_deposit)} icon="users" />
      </div>
    </section>
  );
}
