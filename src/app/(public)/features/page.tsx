import type { Metadata } from "next";
import Link from "next/link";
import { ImagePanel } from "@/components/brand/ImagePanel";
import { RoundPhoto } from "@/components/brand/RoundPhoto";

export const metadata: Metadata = { title: "Features" };

const groups = [
  {
    title: "Kitchen",
    image: "/home/cooking.jpg",
    alt: "A mess kitchen during service",
    points: [
      "Lunch and dinner on one daily meal, marked active, then taken",
      "Guest plates with a name and a price the house sets",
      "A menu for the day, so members know what the pot holds",
      "Market duty: who shops, and the purchases they bring back",
    ],
  },
  {
    title: "Ledger",
    image: "/home/spices.jpg",
    alt: "Dry store for a shared kitchen",
    points: [
      "Deposits against the mess fund, dated and named",
      "Expenses split by market, feast, and other spend",
      "Monthly dues for every seat when the month closes",
      "Fines for a broken rule, paid or waived",
    ],
  },
  {
    title: "People",
    image: "/home/hall.jpg",
    alt: "A dining hall for a shared mess",
    points: [
      "A president who opens the house and holds the subscription",
      "Managers on duty for the month",
      "Members with a code, a room, and a seat at the table",
      "A platform admin who watches every mess, not the stove",
    ],
  },
];

const setupSteps = [
  ["Name the house", "The president gives the mess a name. The system gives it a code."],
  ["Pick a plan", "One month, a short term, or a year. One subscription covers that mess."],
  ["Seat the people", "Managers for the month, then members, each with a room and a code."],
  ["Open the month", "Meals, market, deposits, and dues start on the calendar the house already uses."],
];

export default function FeaturesPage() {
  return (
    <main>
      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        <p className="text-xs uppercase tracking-[0.24em] text-[#e2b657]">The house</p>
        <h1 className="mt-3 max-w-3xl font-display tracking-tight text-4xl leading-tight text-[#f7f1e4] sm:text-5xl">
          What the mess already keeps, written once.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#cbbfa6]">
          A wall list for plates and a notebook for money is how most messes still run. BhuriBhoj keeps both jobs, and keeps them apart by role.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-8 sm:gap-12">
          {[
            ["/home/thali.jpg", "Plates"],
            ["/home/market.jpg", "Market"],
            ["/home/table.jpg", "The table"],
          ].map(([src, label]) => (
            <figure key={label} className="text-center">
              <RoundPhoto src={src} alt={label} className="mx-auto h-40 w-40 sm:h-48 sm:w-48" />
              <figcaption className="mt-3 text-xs uppercase tracking-[0.18em] text-[#e2b657]">{label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e2b657]/15 bg-[#0d0c0a]">
        <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-14">
          <h2 className="font-display tracking-tight text-3xl text-[#f7f1e4]">How a house is opened</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {setupSteps.map(([title, copy], index) => (
              <article key={title} className="rounded-[1.75rem] border border-[#e2b657]/20 bg-black p-5">
                <p className="text-xs tracking-[0.2em] text-[#e2b657]">0{index + 1}</p>
                <h3 className="mt-3 font-display tracking-tight text-2xl text-[#f7f1e4]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#cbbfa6]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        <div className="space-y-16">
          {groups.map((group, index) => (
            <article key={group.title} className="grid items-stretch gap-6 lg:grid-cols-2">
              <ImagePanel src={group.image} alt={group.alt} className={`min-h-80 ${index % 2 ? "lg:order-2" : ""}`}>
                <p className="text-xs tracking-[0.22em] text-[#e2b657]">0{index + 1}</p>
                <h2 className="mt-2 font-display tracking-tight text-4xl text-[#f7f1e4]">{group.title}</h2>
              </ImagePanel>
              <ul className="flex flex-col justify-center space-y-3 rounded-[1.75rem] border border-[#e2b657]/20 p-6 text-sm leading-7 text-[#cbbfa6] sm:p-8">
                {group.points.map((point) => (
                  <li key={point} className="border-l border-[#e2b657]/50 pl-4">
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <Link href="/plans" className="mt-14 inline-flex rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f0cb78]">
          Compare plans
        </Link>
      </section>
    </main>
  );
}
