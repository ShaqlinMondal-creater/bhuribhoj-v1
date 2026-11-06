"use client";

import Link from "next/link";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Icon, type IconName } from "@/components/icons/Icon";
import { useApi } from "@/hooks/useApi";
import { inr, kolkataDateTime } from "@/lib/format";
import { dashboardService } from "@/services/dashboardService";

export function OverviewScreen() {
  const { data, error, loading } = useApi(() => dashboardService.fetch("admin"));
  const platform = data?.platform;
  const logs = platform?.recent_logs ?? [];

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Platform" title="Overview" description="Messes, people, subscriptions, and recent admin actions." />
      {error ? <Notice>{error}</Notice> : null}
      {loading && !data ? <div className="h-28 animate-pulse rounded-2xl bg-white" /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Messes" value={platform?.mess_count ?? 0} icon="building" />
          <StatCard label="Active messes" value={platform?.active_mess_count ?? 0} icon="shield" />
          <StatCard label="Users" value={platform?.user_count ?? 0} icon="users" />
          <StatCard label="Presidents" value={platform?.president_count ?? 0} icon="mark" />
          <StatCard label="Managers" value={platform?.manager_count ?? 0} icon="users" />
          <StatCard label="Members" value={platform?.member_count ?? 0} icon="users" />
          <StatCard label="Active subscriptions" value={platform?.active_subscription_count ?? 0} icon="card" />
          <StatCard label="Paid total" value={inr(platform?.paid_total_inr ?? 0)} icon="receipt" />
          <StatCard label="Recent actions" value={logs.length} icon="logs" />
        </div>

        <section className="flex h-full flex-col rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm shadow-stone-900/5">
          <h2 className="text-xs font-semibold text-stone-950">Quick actions</h2>
          <div className="mt-2 grid flex-1 grid-cols-2 gap-1.5">
            <Action href="/admin/messes" title="Messes" copy="Create or edit a mess" tone="sky" icon="building" />
            <Action href="/admin/users" title="Users" copy="Update platform accounts" tone="violet" icon="users" />
            <Action href="/admin/plans" title="Plans" copy="Set subscription prices" tone="amber" icon="plans" />
            <Action href="/admin/logs" title="Logs" copy="Track admin changes" tone="rose" icon="logs" />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm shadow-stone-900/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-stone-950">Recent activity</h2>
            <p className="mt-1 text-sm text-stone-500">Latest writes across plans, users, messes, coupons, and configs.</p>
          </div>
          <Link href="/admin/logs" className="text-xs font-medium text-sky-700">
            All logs ›
          </Link>
        </div>
        {logs.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No logged actions yet. Create or edit a plan, mess, user, coupon, or config to start the trail.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-950">{log.message}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {log.actor ?? "System"}
                    {log.mess ? ` · ${log.mess}` : ""}
                    {" · "}
                    <span className="font-mono text-stone-400">{log.action}</span>
                  </p>
                </div>
                <p className="shrink-0 text-xs text-stone-500">{log.created_at ? kolkataDateTime(String(log.created_at)) : "—"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function Action({
  href,
  title,
  copy,
  tone,
  icon,
}: {
  href: string;
  title: string;
  copy: string;
  tone: "sky" | "violet" | "amber" | "rose";
  icon: IconName;
}) {
  const tones = {
    sky: "bg-sky-50 text-sky-800",
    violet: "bg-violet-50 text-violet-800",
    amber: "bg-amber-50 text-amber-900",
    rose: "bg-rose-50 text-rose-800",
  };

  return (
    <Link href={href} className="flex items-start gap-2 rounded-xl border border-stone-200/80 bg-stone-50/80 px-2.5 py-2 transition hover:border-stone-300 hover:bg-white">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-stone-950">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">{copy}</span>
      </span>
    </Link>
  );
}
