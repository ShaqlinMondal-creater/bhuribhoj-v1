"use client";

import Link from "next/link";
import { useMessUser } from "@/components/auth/MessSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { isPresident } from "@/lib/auth/roles";
import { inr } from "@/lib/format";
import { messService } from "@/services/messService";

export function SubscriptionDetailScreen() {
  const user = useMessUser();
  const president = isPresident(user?.role);
  const house = useApi(() => messService.house(user?.role ?? "member"), Boolean(user));
  const subscription = house.data?.data?.active_subscription ?? null;
  const plan = subscription?.plan;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Setting"
        title="Subscriptions"
        description="The plan this mess is using now."
      />
      {house.error ? <Notice>{house.error}</Notice> : null}
      {house.loading ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!house.loading && !house.error && !subscription ? (
        <EmptyState icon="card" title="No subscription in use" description="This mess does not have an active plan." />
      ) : null}
      {subscription ? (
        <dl className="max-w-xl divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
          <Row label="Plan" value={plan?.name ?? "Plan"} />
          <Row label="Length" value={plan ? months(plan.duration_months) : "—"} />
          <Row label="Price" value={plan ? inr(plan.price_inr) : inr(subscription.amount_paid_inr)} />
          <Row label="Paid" value={inr(subscription.amount_paid_inr)} />
          <Row label="Status" value={subscription.status} />
          <Row label="Starts" value={showDate(subscription.starts_on)} />
          <Row label="Ends" value={showDate(subscription.ends_on)} />
        </dl>
      ) : null}
      {president ? (
        <Link href="/mess/plans" className="inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">
          {subscription ? "Change plan" : "Buy a plan"}
        </Link>
      ) : null}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium capitalize text-stone-900">{value}</dd>
    </div>
  );
}

function months(count: number) {
  return `${count} ${count === 1 ? "month" : "months"}`;
}

function showDate(value: string | null) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}
