"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { messService, type HouseSubscription } from "@/services/messService";
import type { SubscriptionRow } from "@/services/subscriptionService";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

type CurrentPlan = {
  name: string;
  detail: string;
  status: string;
  endsOn: string | null;
};

type Clock = {
  ended: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function CurrentSubscriptionCard({ rows, listLoading }: { rows: SubscriptionRow[]; listLoading: boolean }) {
  const house = useApi(() => messService.house("president"));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const current = pickCurrent(rows, house.data?.data?.active_subscription ?? null);

  if (!current && (house.loading || listLoading)) {
    return <div className="h-52 animate-pulse rounded-3xl bg-white" />;
  }

  if (!current) {
    return (
      <section className="overflow-hidden rounded-3xl bg-[var(--panel)] px-6 py-8 text-[var(--panel-ink)] shadow-sm sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Current subscription</p>
        <h2 className="font-display mt-3 text-3xl font-semibold">No plan in use</h2>
        <p className="mt-2 max-w-md text-sm text-[var(--panel-muted)]">This mess has no plan in use right now.</p>
        <Link href="/mess/plans" className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]">
          Buy a plan
        </Link>
      </section>
    );
  }

  const clock = remainingClock(current.endsOn, now);

  return (
    <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="bg-[var(--panel)] px-6 py-7 text-[var(--panel-ink)] sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Current subscription</p>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <h2 className="font-display text-4xl font-semibold tracking-tight">{current.name}</h2>
            <StatusPill status={current.status} />
          </div>
          {current.detail ? <p className="mt-3 text-sm text-[var(--panel-muted)]">{current.detail}</p> : null}
          <Link href="/mess/plans" className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]">
            Change plan
          </Link>
        </div>
        <div className="flex flex-col justify-between bg-[var(--accent-soft)] px-6 py-7 sm:px-8">
          <div>
            <p className="text-xs font-medium text-stone-500">Valid until</p>
            <p className="font-display mt-1 text-3xl font-semibold text-stone-950">{validUntil(current.endsOn)}</p>
          </div>
          {clock ? (
            <div className="mt-6">
              <p className="text-xs font-medium text-stone-500">Time remaining</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <Tick value={clock.days} label={clock.days === 1 ? "Day" : "Days"} />
                <Tick value={clock.hours} label={clock.hours === 1 ? "Hour" : "Hours"} />
                <Tick value={clock.minutes} label={clock.minutes === 1 ? "Min" : "Mins"} />
                <Tick value={clock.seconds} label={clock.seconds === 1 ? "Sec" : "Secs"} />
              </div>
              {clock.ended ? <p className="mt-3 text-sm font-medium text-stone-700">This plan has ended.</p> : null}
            </div>
          ) : (
            <p className="mt-6 text-sm text-stone-500">No end date on this plan.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Tick({ value, label }: { value: number; label: string }) {
  const shown = value >= 100 ? String(value) : String(value).padStart(2, "0");
  return (
    <div className="rounded-2xl bg-white px-2 py-3 text-center shadow-sm shadow-stone-900/5">
      <p className="font-display text-2xl font-semibold tabular-nums text-stone-950 sm:text-3xl">{shown}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
      : status === "pending"
        ? "bg-amber-400 text-stone-950"
        : status === "cancelled"
          ? "bg-red-500 text-white"
          : "bg-white/15 text-[var(--panel-ink)]";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{statusLabel[status] ?? status}</span>;
}

function pickCurrent(rows: SubscriptionRow[], houseSub: HouseSubscription | null): CurrentPlan | null {
  const active = rows.find((row) => row.status === "active");
  if (active) return fromRow(active);
  if (houseSub) return fromHouse(houseSub);
  if (rows[0]) return fromRow(rows[0]);
  return null;
}

function fromRow(row: SubscriptionRow): CurrentPlan {
  return {
    name: row.plan?.name ?? "Plan",
    detail: planDetail(row.plan?.duration_months, row.plan?.price_inr ?? row.amount_paid_inr),
    status: row.status,
    endsOn: row.ends_on,
  };
}

function fromHouse(row: HouseSubscription): CurrentPlan {
  return {
    name: row.plan?.name ?? "Plan",
    detail: planDetail(row.plan?.duration_months, row.plan?.price_inr ?? row.amount_paid_inr),
    status: row.status,
    endsOn: row.ends_on,
  };
}

function planDetail(monthsCount?: number | null, price?: number | null) {
  const parts: string[] = [];
  if (monthsCount) parts.push(`${monthsCount} ${monthsCount === 1 ? "month" : "months"}`);
  if (price != null) parts.push(inr(price));
  return parts.join(" · ");
}

function validUntil(value: string | null) {
  const parts = dateParts(value);
  if (!parts) return "—";
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function remainingClock(value: string | null, now: number): Clock | null {
  const parts = dateParts(value);
  if (!parts) return null;
  const end = Date.parse(
    `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T23:59:59+05:30`,
  );
  if (Number.isNaN(end)) return null;
  const diff = end - now;
  const total = Math.max(0, Math.floor(diff / 1000));
  return {
    ended: diff <= 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function dateParts(value: string | null) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}
