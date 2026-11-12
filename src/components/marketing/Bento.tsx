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
  { title: "Daily meals", copy: "Lunch and dinner, active and taken, for each member.", icon: UtensilsCrossed },
  { title: "Guest meals", copy: "A visitor’s plate, priced the way the house agreed.", icon: UserPlus },
  { title: "Market duty", copy: "Who shops, and what they bought that morning.", icon: ShoppingBasket },
  { title: "Menus", copy: "What the kitchen is cooking, written for the day.", icon: NotebookPen },
  { title: "Deposits", copy: "Money a member puts into the mess fund.", icon: Wallet },
  { title: "Expenses", copy: "Market, feast, and other spend, with a note.", icon: Receipt },
  { title: "Monthly dues", copy: "The share each seat owes when the month closes.", icon: CalendarClock },
  { title: "Fines", copy: "A broken rule, an amount, and whether it was paid or waived.", icon: Scale },
];

export function Bento() {
  return (
    <section className="marketing bg-[var(--surface)]">
      <div className="m-wrap py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium text-[var(--accent)]">What is written down</p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Eight books. One house.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            These are the records a president and a manager already keep. Each one has a place, instead of a fresh notebook every month.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book, index) => {
            const Icon = book.icon;
            return (
              <Reveal key={book.title} delay={index * 0.03}>
                <article className="h-full border-t border-[var(--border)] pt-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--site)] text-[var(--accent)]">
                      <Icon size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{book.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{book.copy}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
