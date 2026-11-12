"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { planService } from "@/services/planService";
import type { Plan } from "@/types/auth";

export const planFeatures = [
  "Lunch and dinner tracking for every member",
  "Shopping duty and daily purchases",
  "Deposits, expenses, dues, and fines",
  "Guest meals with your own pricing",
  "Roles for president, managers, and members",
];

export function planLabel(plan: Plan) {
  if (plan.duration_months === 1) return "Monthly";
  if (plan.duration_months === 3) return "Semester";
  if (plan.duration_months >= 12) return "Yearly";
  return plan.name;
}

export function usePlans() {
  return useApi(planService.fetch);
}

export function PlanGrid({
  plans,
  activeMonths,
}: {
  plans: Plan[];
  activeMonths?: number;
}) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-3">
      {plans.map((plan) => {
        const popular = plan.duration_months === 3;
        const active = activeMonths === plan.duration_months || (activeMonths == null && popular);
        return (
          <article
            key={plan.id}
            className={`flex flex-col rounded-[var(--radius)] border p-6 ${
              active ? "border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--shadow)]" : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">{planLabel(plan)}</h3>
              {popular ? (
                <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-ink)]">
                  Most popular
                </span>
              ) : null}
            </div>
            <p className="mt-6 text-4xl font-semibold text-[var(--accent)]">{inr(plan.price_inr)}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {plan.duration_months} month{plan.duration_months > 1 ? "s" : ""} · one mess
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-[var(--muted)]">
              {planFeatures.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/contact" className={`m-btn mt-8 ${active ? "m-btn-primary" : "m-btn-ghost"}`}>
              Get started
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export function PlanPreview() {
  const { data, error, loading } = usePlans();
  const plans = data?.data ?? [];

  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <p className="text-sm font-medium text-[var(--accent)]">Plans</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One kitchen. One subscription.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
          Choose a month, a short term, or a full year. Your president opens the kitchen; managers and members join their roles.
        </p>
        {error ? (
          <p className="mt-6 text-sm text-[var(--muted)]">Plans are unavailable right now. Try again in a moment.</p>
        ) : null}
        {loading ? <div className="mt-8 h-48 animate-pulse rounded-[var(--radius)] bg-[var(--surface)]" /> : null}
        {!loading && plans.length ? (
          <div className="mt-8">
            <PlanGrid plans={plans} />
          </div>
        ) : null}
        <Link href="/plans" className="mt-6 inline-flex text-sm font-semibold text-[var(--accent)]">
          Compare plans
        </Link>
      </div>
    </section>
  );
}
