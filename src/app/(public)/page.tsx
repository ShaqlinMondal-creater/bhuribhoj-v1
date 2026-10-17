import Link from "next/link";
import { ImagePanel } from "@/components/brand/ImagePanel";
import { RoundPhoto } from "@/components/brand/RoundPhoto";
import { HeroStage } from "@/components/home/HeroStage";

const facts = [
  { value: "2", label: "Meals a day, lunch and dinner" },
  { value: "4", label: "Roles, each with its own door" },
  { value: "1", label: "Ledger for the whole month" },
  { value: "12", label: "Months on the longest plan" },
];

const setup = [
  { src: "/home/market.jpg", title: "Morning market", copy: "Vegetables, rice, and oil bought for the pot, written against the day." },
  { src: "/home/spices.jpg", title: "The store", copy: "Masala, dal, and dry stock that the kitchen draws from all month." },
  { src: "/home/cooking.jpg", title: "The kitchen", copy: "One stove, one shift, lunch and dinner cooked for every seat." },
  { src: "/home/curry.jpg", title: "The pot", copy: "The shared dish. Portions follow who marked a meal." },
  { src: "/home/thali.jpg", title: "The plate", copy: "A member’s lunch or dinner, marked active, then marked taken." },
  { src: "/home/biryani.jpg", title: "Feast days", copy: "A richer meal still belongs on the same ledger." },
  { src: "/home/hall.jpg", title: "The hall", copy: "The room where the house eats. Guest plates sit at the same table." },
  { src: "/home/roti.jpg", title: "The tawa", copy: "A hot plate from the same kitchen. It still counts as one meal on the day’s list." },
];

const day = [
  { time: "06:30", title: "Market duty", copy: "The manager on duty buys for the day and notes every purchase.", image: "/home/market.jpg" },
  { time: "11:00", title: "Lunch is marked", copy: "Members who will eat set lunch active before the plates go out.", image: "/home/thali.jpg" },
  { time: "13:30", title: "Plates taken", copy: "Taken meals stay on the record. A skipped meal does not.", image: "/home/thali.jpg" },
  { time: "19:30", title: "Dinner, same book", copy: "Dinner is a second sitting in the same daily meal, not a second system.", image: "/home/dal.jpg" },
  { time: "Month end", title: "The close", copy: "Deposits, spend, dues, and fines are read together before the next month opens.", image: "/home/table.jpg" },
];

const records = [
  ["Daily meals", "Lunch and dinner, active and taken, for each member."],
  ["Guest meals", "A visitor’s plate, priced the way the house agreed."],
  ["Market duty", "Who shops, and what they bought that morning."],
  ["Menus", "What the kitchen is cooking, written for the day."],
  ["Deposits", "Money a member puts into the mess fund."],
  ["Expenses", "Market, feast, and other spend, with a note."],
  ["Monthly dues", "The share each seat owes when the month closes."],
  ["Fines", "A broken rule, an amount, and whether it was paid or waived."],
];

const roles = [
  ["Platform admin", "Sees every mess, every plan, and every invitation. Does not cook."],
  ["President", "Opens the house, buys the plan, and invites the first managers."],
  ["Manager", "Runs the month on duty: meals, market, money, and members."],
  ["Member", "Marks meals, sees the house they belong to, and pays what is due."],
];

const questions = [
  ["Who is this for?", "A hostel kitchen, a paying-guest mess, or a college dining hall that already shares one pot and one fund."],
  ["Does every person see the same screen?", "No. Admin, president, manager, and member each enter their own area."],
  ["What happens at month end?", "Dues, deposits, expenses, and fines sit in one ledger so the house can close the month."],
  ["Can a guest eat?", "Yes. A guest meal is its own record, with a name and a price set by the house."],
  ["How long is a subscription?", "A mess picks a plan for one month, a short term, or a full year. The president opens it."],
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#e2b657]/15">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(226,182,87,0.16),transparent_42%),radial-gradient(circle_at_10%_80%,rgba(226,59,59,0.12),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-[96rem] items-center gap-6 px-4 py-10 sm:px-8 sm:py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#e2b657]">ভুরিভোজ · the mess house</p>
            <h1 className="mt-5 font-display tracking-tight text-4xl leading-[1.08] text-[#f7f1e4] sm:text-5xl lg:text-6xl">
              The kitchen, the ledger, and the people. One house.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-[#cbbfa6]">
              BhuriBhoj is the private system for a shared mess. Meals at noon and night. Money at the end of the month. A seat for every role.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plans" className="rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f0cb78]">
                See the plans
              </Link>
              <Link href="/features" className="rounded-full border border-[#e2b657]/60 px-5 py-3 text-sm text-[#e2b657] hover:bg-[#e2b657]/10">
                The house, in detail
              </Link>
            </div>
          </div>
          <HeroStage />
        </div>
      </section>

      <section className="border-b border-[#e2b657]/15 bg-black">
        <div className="mx-auto grid max-w-[96rem] grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="border-[#e2b657]/15 px-4 py-6 sm:px-8 sm:py-8 lg:border-l">
              <p className="font-display tracking-tight text-4xl text-[#e2b657]">{fact.value}</p>
              <p className="mt-2 text-sm leading-6 text-[#cbbfa6]">{fact.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">A mess, set up</p>
        <h2 className="mt-3 max-w-2xl font-display tracking-tight text-3xl text-[#f7f1e4] sm:text-4xl md:text-5xl">
          From the market bag to the last plate on the table.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cbbfa6]">
          A house already has a kitchen, a store, a dining hall, and a notebook. These are the rooms BhuriBhoj is written for.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {setup.map((item) => (
            <figure key={item.title} className="flex flex-col items-center text-center">
              <RoundPhoto src={item.src} alt={item.title} />
              <figcaption className="mt-4">
                <h3 className="font-display tracking-tight text-xl text-[#f7f1e4]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#cbbfa6]">{item.copy}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e2b657]/15 bg-[#0d0c0a]">
        <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">One day in the house</p>
          <h2 className="mt-3 font-display tracking-tight text-3xl text-[#f7f1e4] sm:text-4xl">The order the kitchen already keeps.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {day.map((item, index) => (
              <ImagePanel
                key={item.title}
                src={item.image}
                alt={item.title}
                className={`min-h-80 ${index === 0 ? "sm:col-span-2 lg:col-span-4 lg:min-h-[28rem]" : "lg:col-span-2"}`}
              >
                <p className="text-sm tracking-[0.16em] text-[#e2b657]">{item.time}</p>
                <h3 className="mt-2 font-display tracking-tight text-3xl text-[#f7f1e4]">{item.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-[#f7f1e4]/85">{item.copy}</p>
              </ImagePanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">What is written down</p>
            <h2 className="mt-3 font-display tracking-tight text-3xl text-[#f7f1e4] sm:text-4xl">Eight books. One house.</h2>
            <p className="mt-4 text-sm leading-7 text-[#cbbfa6]">
              These are the records a president and a manager already keep. BhuriBhoj gives each one a place, instead of a fresh notebook every month.
            </p>
            <RoundPhoto src="/home/kitchen.jpg" alt="A working kitchen" className="mx-auto mt-6 h-52 w-52 sm:h-64 sm:w-64" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {records.map(([title, copy]) => (
              <article key={title} className="rounded-[1.75rem] border border-[#e2b657]/20 bg-black p-5">
                <h3 className="text-[#f7f1e4]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#cbbfa6]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e2b657]/15">
        <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">Who sits where</p>
          <h2 className="mt-3 font-display tracking-tight text-3xl text-[#f7f1e4] sm:text-4xl">Four doors. No shared screen.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map(([title, copy], index) => (
              <article key={title} className="rounded-[1.75rem] border border-[#e2b657]/25 bg-black/40 p-5">
                <p className="text-xs tracking-[0.2em] text-[#e2b657]">0{index + 1}</p>
                <h3 className="mt-3 font-display tracking-tight text-2xl text-[#f7f1e4]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#cbbfa6]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        <ImagePanel src="/home/hall.jpg" alt="A dining hall set for a shared meal" className="min-h-[26rem]">
          <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">Plans</p>
          <h2 className="mt-3 max-w-xl font-display tracking-tight text-3xl text-[#f7f1e4] sm:text-5xl">
            One mess. One subscription. The length of the term.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#f7f1e4]/85">
            A short stay, a semester, or a full year. The president opens the house on a plan, then managers and members take their seats.
          </p>
          <Link href="/plans" className="mt-6 inline-flex w-fit rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f0cb78]">
            View plans
          </Link>
        </ImagePanel>
      </section>

      <section className="border-t border-[#e2b657]/15 bg-black">
        <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
          <h2 className="font-display tracking-tight text-3xl text-[#f7f1e4] sm:text-4xl">Questions the house asks first</h2>
          <div className="mt-8 divide-y divide-[#e2b657]/20 border-y border-[#e2b657]/20">
            {questions.map(([title, copy]) => (
              <article key={title} className="grid gap-2 py-5 md:grid-cols-[240px_1fr] md:gap-8">
                <h3 className="text-[#e2b657]">{title}</h3>
                <p className="text-sm leading-7 text-[#cbbfa6]">{copy}</p>
              </article>
            ))}
          </div>
          <ImagePanel src="/home/cooking.jpg" alt="A kitchen ready for service" className="mt-10 min-h-64">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-display tracking-tight text-3xl text-[#f7f1e4]">Ready to open a house?</p>
                <p className="mt-2 text-sm text-[#f7f1e4]/85">Tell us the mess name. We will point you to the right door.</p>
              </div>
              <Link href="/contact" className="rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f0cb78]">
                Write to us
              </Link>
            </div>
          </ImagePanel>
        </div>
      </section>
    </main>
  );
}
