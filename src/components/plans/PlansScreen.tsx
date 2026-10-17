"use client";

import Link from "next/link";
import { ImagePanel } from "@/components/brand/ImagePanel";
import { Notice } from "@/components/ui/Notice";
import { useApi } from "@/hooks/useApi";
import { inr } from "@/lib/format";
import { planService } from "@/services/planService";

const included = [
  "Lunch and dinner for every member",
  "Market duty and the day’s purchases",
  "Deposits, expenses, dues, and fines",
  "Guest plates, priced by the house",
  "President, managers, and members",
];

export function PlansScreen() {
  const { data, error, loading } = useApi(planService.fetch);
  const plans = data?.data ?? [];

  return (
    <main>
      <section className="mx-auto max-w-[96rem] px-4 pt-8 sm:px-8 sm:pt-12">
        <ImagePanel src="/home/thali.jpg" alt="A full mess plate" className="min-h-72 sm:min-h-80">
          <p className="text-xs uppercase tracking-[0.24em] text-[#e2b657]">Subscription</p>
          <h1 className="mt-3 max-w-2xl font-display tracking-tight text-4xl text-[#f7f1e4] sm:text-5xl">
            A plan for the length of the term.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#f7f1e4]/85">
            One mess. One subscription. The same house for a month, a short term, or a full year.
          </p>
        </ImagePanel>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        {error ? (
          <div className="mb-8">
            <Notice>{error}</Notice>
          </div>
        ) : null}
        {loading ? <div className="h-72 animate-pulse rounded-[1.75rem] bg-[#161616]" /> : null}
        <div className="grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const featured = index === 1;
            return (
              <article
                key={plan.id}
                className={`flex flex-col rounded-[1.75rem] border p-7 ${
                  featured
                    ? "border-[#e2b657] bg-[#14110b] shadow-[0_20px_60px_rgba(226,182,87,0.12)] lg:-translate-y-3"
                    : "border-[#e2b657]/25 bg-black"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display tracking-tight text-3xl text-[#f7f1e4]">{plan.name}</h2>
                  {featured ? (
                    <span className="rounded-full bg-[#e2b657] px-3 py-1 text-xs font-semibold text-black">Usual term</span>
                  ) : null}
                </div>
                <p className="mt-8 font-display tracking-tight text-5xl text-[#e2b657]">{inr(plan.price_inr)}</p>
                <p className="mt-2 text-sm text-[#cbbfa6]">
                  {plan.duration_months} month{plan.duration_months > 1 ? "s" : ""} · one mess
                </p>
                <ul className="mt-8 flex-1 space-y-3 border-t border-[#e2b657]/20 pt-6 text-sm leading-6 text-[#cbbfa6]">
                  {included.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e2b657]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold ${
                    featured ? "bg-[#e2b657] text-black hover:bg-[#f0cb78]" : "border border-[#e2b657]/60 text-[#e2b657] hover:bg-[#e2b657]/10"
                  }`}
                >
                  Sign in to open
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Kitchen", "Lunch, dinner, guest meals, menus, and market duty."],
            ["Money", "Deposits, expenses, monthly dues, and fines."],
            ["People", "A code and a room for every member on the plan."],
            ["Platform", "An admin can see the mess. They do not share its screen."],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-[1.75rem] border border-[#e2b657]/20 p-5">
              <h3 className="font-display tracking-tight text-2xl text-[#f7f1e4]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#cbbfa6]">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
