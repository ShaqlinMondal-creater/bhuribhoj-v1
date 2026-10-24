import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { photos } from "@/components/marketing/photos";

export const metadata: Metadata = {
  title: "About",
  description: "BhuriBhoj is named for a full plate and built for the people who share a mess.",
  openGraph: {
    title: "About · BhuriBhoj",
    description: "One kitchen, four doors, and the month the house already uses.",
  },
};

const values = [
  ["One kitchen", "A subscription belongs to a single mess and the people who eat there."],
  ["Four doors", "Admin, president, manager, and member do not share a screen."],
  ["The month", "Plans, dues, and manager duty follow the calendar the house already uses."],
  ["The plate first", "Money matters at month end. The daily question is still who eats."],
];

export default function AboutPage() {
  return (
    <main className="marketing">
      <section className="m-wrap grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">About the house</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Named for a full plate. Built for the people who share it.
          </h1>
          <p className="mt-5 text-base leading-7 text-[var(--muted)]">
            <span className="bn text-[var(--text)]">ভুরিভোজ</span> is a full meal. A mess is the room where that meal is shared: a president, managers for the month, and members who eat from the same pot.
          </p>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            The list of plates used to live on a wall. The money used to live in a notebook. BhuriBhoj keeps both. Inside one mess, each role sees only its own work.
          </p>
        </div>
        <div className="flex justify-center">
          <BrandLogo className="h-48 w-48 sm:h-64 sm:w-64" />
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="m-wrap grid items-center gap-8 py-16 lg:grid-cols-2">
          <figure className="m-photo relative aspect-[16/10] overflow-hidden rounded-2xl">
            <Image
              src={photos.aboutKitchen}
              alt="An empty kitchen with a stove, shelves, and room to cook for a house"
              fill
              sizes="(max-width: 1024px) 100vw, 560px"
              placeholder="blur"
              className="object-cover"
            />
          </figure>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">The mission</h2>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              Give a shared kitchen a private system that follows the day it already has: market in the morning, plates at noon and night, and a ledger that can close the month.
            </p>
          </div>
        </div>
      </section>

      <section className="m-wrap py-16 md:py-24">
        <h2 className="text-3xl font-semibold tracking-tight">What we hold to</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {values.map(([title, copy]) => (
            <article key={title} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </article>
          ))}
        </div>
        <Link href="/contact" className="m-btn m-btn-primary mt-10">
          Talk about your mess
        </Link>
      </section>
    </main>
  );
}
