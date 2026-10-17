"use client";

import {
  CalendarClock,
  NotebookPen,
  Receipt,
  Scale,
  ShoppingBasket,
  UserPlus,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const books = [
  { title: "Daily meals", copy: "Lunch and dinner, active and taken, for each member.", icon: UtensilsCrossed, span: "md:col-span-2 md:row-span-2", preview: "Lunch · 18 active" },
  { title: "Guest meals", copy: "A visitor’s plate, priced the way the house agreed.", icon: UserPlus, span: "md:col-span-2", preview: "Guest · ₹80" },
  { title: "Market duty", copy: "Who shops, and what they bought that morning.", icon: ShoppingBasket, span: "", preview: "Duty · Rafi" },
  { title: "Menus", copy: "What the kitchen is cooking, written for the day.", icon: NotebookPen, span: "", preview: "Dal, rice, sabzi" },
  { title: "Deposits", copy: "Money a member puts into the mess fund.", icon: Wallet, span: "md:col-span-2", preview: "Deposit · ₹1,500" },
  { title: "Expenses", copy: "Market, feast, and other spend, with a note.", icon: Receipt, span: "", preview: "Market · ₹640" },
  { title: "Monthly dues", copy: "The share each seat owes when the month closes.", icon: CalendarClock, span: "", preview: "Due · open" },
  { title: "Fines", copy: "A broken rule, an amount, and whether it was paid or waived.", icon: Scale, span: "md:col-span-2", preview: "Fine · waived" },
];

function glow(event: React.MouseEvent<HTMLElement>) {
  const box = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
}

export function Bento() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">What is written down</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Eight books. One house.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            These are the records a president and a manager already keep. Each one has a place, instead of a fresh notebook every month.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {books.map((book, index) => {
            const Icon = book.icon;
            return (
              <Reveal key={book.title} delay={index * 0.04} className={book.span}>
                <article
                  onMouseMove={glow}
                  className="glow-card flex h-full flex-col p-5 transition duration-200 ease-out hover:-translate-y-1"
                >
                  <div className="relative flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className="text-lg font-semibold">{book.title}</h3>
                  </div>
                  <p className="relative mt-3 text-sm leading-6 text-[var(--muted)]">{book.copy}</p>
                  <p className="relative mt-5 rounded-[12px] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)]">{book.preview}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
