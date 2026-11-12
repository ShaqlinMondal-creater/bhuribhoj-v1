import Image from "next/image";
import { Reveal } from "@/components/marketing/Reveal";

const steps = [
  "President opens one mess, picks a plan, and invites managers",
  "Members join and mark lunch & dinner each day",
  "Managers run market duty, menus, and guest meals",
  "Track deposits, expenses, dues, and fines in one ledger",
  "One dashboard for meals, members, and month-end close",
];

export function MessFlow() {
  return (
    <section className="marketing border-y border-[var(--border)] bg-[var(--site)]">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">How it works</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            From opening a mess to closing the month
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            Five steps your kitchen already follows — written once in BhuriBhoj for hostels, PGs, and shared kitchens anywhere.
          </p>
        </Reveal>

        <Reveal className="mt-10">
          <figure className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-[var(--shadow)]">
            <Image
              src="/marketing/bhuribhoj-mess-flow.jpg"
              alt="BhuriBhoj mess workflow: open a mess, mark meals, run market and menus, track the ledger, and close the month on one dashboard"
              width={1920}
              height={1080}
              className="h-auto w-full"
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority={false}
            />
          </figure>
        </Reveal>

        <ol className="mt-8 grid gap-3 sm:hidden">
          {steps.map((step, index) => (
            <li
              key={step}
              className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--muted)]"
            >
              <span className="font-semibold text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</span>
              <span className="mt-1 block text-[var(--text)]">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
