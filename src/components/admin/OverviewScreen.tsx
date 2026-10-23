"use client";

import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import { dashboardService } from "@/services/dashboardService";

export function OverviewScreen() {
  const { data, error, loading } = useApi(() => dashboardService.fetch("admin"));
  const platform = data?.platform;

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Platform" title="Overview" description="Messes and people across BhuriBhoj." />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-28 animate-pulse rounded-2xl bg-white" /> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Messes" value={platform?.mess_count ?? 0} icon="building" />
        <StatCard label="Active messes" value={platform?.active_mess_count ?? 0} icon="shield" />
        <StatCard label="Users" value={platform?.user_count ?? 0} icon="users" />
      </div>
    </section>
  );
}
