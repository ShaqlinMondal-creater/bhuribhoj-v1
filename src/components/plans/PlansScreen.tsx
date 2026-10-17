"use client";

import { useState } from "react";
import { FaqList } from "@/components/marketing/FaqList";
import { PlanGrid, usePlans } from "@/components/marketing/PlanCards";

const periods = [
  { months: 1, label: "Monthly" },
  { months: 3, label: "Semester" },
  { months: 12, label: "Yearly" },
];

const questions = [
  { q: "Do the plans include different features?", a: "No. Every plan is the same house. The difference is how long the subscription runs." },
  { q: "Who buys the plan?", a: "The president opens the house on a plan, then invites managers and members." },
  { q: "Can a short stay use a month?", a: "Yes. A month, a semester, or a year. One subscription covers that mess." },
];

export function PlansScreen() {
  const { data, error, loading } = usePlans();
  const plans = data?.data ?? [];
  const [months, setMonths] = useState(3);

  return (
    <main className="marketing">
      <section className="m-wrap py-16 md:py-24">
        <p className="text-sm font-medium text-[var(--accent)]">Subscription</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">A plan for the length of the term.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
          One mess. One subscription. The same house for a month, a semester, or a full year.
        </p>
        <div className="mt-8 inline-flex rounded-full border border-[var(--border)] p-1" role="group" aria-label="Plan length">
          {periods.map((period) => {
            const selected = months === period.months;
            return (
              <button
                key={period.months}
                type="button"
                aria-pressed={selected}
                onClick={() => setMonths(period.months)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${selected ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "text-[var(--muted)]"}`}
              >
                {period.label}
              </button>
            );
          })}
        </div>
        {error ? <p className="mt-6 text-sm text-[#ffb4b4]">Plans are unavailable right now. Try again in a moment.</p> : null}
        {loading ? <div className="mt-8 h-56 animate-pulse rounded-[var(--radius)] bg-[var(--surface)]" /> : null}
        {!loading && plans.length ? (
          <div className="mt-8">
            <PlanGrid plans={plans} activeMonths={months} />
          </div>
        ) : null}
      </section>
      <section className="m-wrap pb-16 md:pb-24">
        <h2 className="text-3xl font-semibold tracking-tight">Questions about plans</h2>
        <div className="mt-6">
          <FaqList items={questions} />
        </div>
      </section>
    </main>
  );
}
