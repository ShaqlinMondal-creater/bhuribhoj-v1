import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Features",
  description: "Kitchen, ledger, and people: what a mess already keeps, written once in BhuriBhoj.",
  openGraph: {
    title: "Features · BhuriBhoj",
    description: "Meals, market duty, deposits, dues, and a door for every role.",
  },
};

const groups = [
  {
    title: "Kitchen",
    copy: "Lunch and dinner live on one daily meal. Guests, the menu, and the morning market sit beside it.",
    points: ["Lunch and dinner, marked active, then taken", "Guest plates with a name and a price", "A menu for the day", "Market duty and the purchases"],
    preview: (
      <div className="space-y-3">
        <p className="text-xs text-[var(--muted)]">Today</p>
        <div className="flex justify-between rounded-[12px] bg-[var(--surface-2)] px-3 py-3 text-sm">
          <span>Lunch</span>
          <span className="text-[var(--accent)]">Active</span>
        </div>
        <div className="flex justify-between rounded-[12px] bg-[var(--surface-2)] px-3 py-3 text-sm">
          <span>Dinner</span>
          <span>Not marked</span>
        </div>
      </div>
    ),
  },
  {
    title: "Ledger",
    copy: "Deposits, spend, dues, and fines stay in one account so the month can close.",
    points: ["Deposits against the mess fund", "Expenses by market, feast, and other spend", "Monthly dues for every seat", "Fines, paid or waived"],
    preview: (
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-[var(--muted)]">Deposits</span><span>₹12,400</span></div>
        <div className="flex justify-between"><span className="text-[var(--muted)]">Expenses</span><span>₹8,150</span></div>
        <div className="flex justify-between border-t border-[var(--border)] pt-3 font-semibold"><span>Balance</span><span className="text-[var(--accent)]">₹4,250</span></div>
      </div>
    ),
  },
  {
    title: "People",
    copy: "A president opens the house. Managers run the month. Members mark their meals. Admin watches the platform.",
    points: ["A president holds the subscription", "Managers on duty for the month", "Members with a code and a room", "A platform admin over every mess"],
    preview: (
      <ul className="space-y-2 text-sm">
        {["President", "Manager", "Member"].map((role) => (
          <li key={role} className="flex items-center justify-between rounded-[12px] bg-[var(--surface-2)] px-3 py-2">
            <span>{role}</span>
            <span className="text-xs text-[var(--muted)]">Own door</span>
          </li>
        ))}
      </ul>
    ),
  },
];

const steps = [
  ["Name the house", "The president gives the mess a name. The system gives it a code."],
  ["Pick a plan", "One month, a short term, or a year. One subscription covers that mess."],
  ["Seat the people", "Managers for the month, then members, each with a room and a code."],
  ["Open the month", "Meals, market, deposits, and dues start on the calendar the house already uses."],
];

export default function FeaturesPage() {
  return (
    <main className="marketing">
      <section className="m-wrap py-16 md:py-24">
        <p className="text-sm font-medium text-[var(--accent)]">The house</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          What the mess already keeps, written once.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">
          A wall list for plates and a notebook for money is how most messes still run. BhuriBhoj keeps both jobs, and keeps them apart by role.
        </p>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="m-wrap py-16">
          <h2 className="text-2xl font-semibold tracking-tight">How a house is opened</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, copy], index) => (
              <li key={title} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-5">
                <p className="text-sm font-semibold text-[var(--accent)]">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="m-wrap space-y-16 py-16 md:py-24">
        {groups.map((group, index) => (
          <article key={group.title} className="grid items-center gap-8 lg:grid-cols-2">
            <div className={index % 2 ? "lg:order-2" : ""}>
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                <p className="text-sm font-semibold text-[var(--accent)]">{group.title}</p>
                <div className="mt-4">{group.preview}</div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{group.title}</h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">{group.copy}</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--muted)]">
                {group.points.map((point) => (
                  <li key={point} className="border-l border-[var(--accent)] pl-4">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
        <Link href="/plans" className="m-btn m-btn-primary">
          Compare plans
        </Link>
      </section>
    </main>
  );
}
