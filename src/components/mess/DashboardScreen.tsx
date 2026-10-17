"use client";

import { UserChip } from "@/components/layout/MessShell";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useMessUser } from "@/components/auth/MessSession";
import { useApi } from "@/hooks/useApi";
import { roleLabel } from "@/lib/auth/roles";
import { inr } from "@/lib/format";
import { dashboardService } from "@/services/dashboardService";

export function DashboardScreen() {
  const user = useMessUser();
  const { data, error, loading } = useApi(dashboardService.fetch);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={user ? `${user.mess?.name ?? "Mess"} · ${roleLabel[user.role]}` : "Mess"}
          title={user ? `Hello, ${user.name.split(" ")[0]}` : "Dashboard"}
          description="Deposits, expenses, and your own balance for this mess."
        />
        {user ? <UserChip user={user} /> : null}
      </div>
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
