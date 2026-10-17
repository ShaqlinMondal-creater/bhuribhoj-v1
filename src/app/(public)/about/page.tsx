import type { Metadata } from "next";
import Link from "next/link";
import { ImagePanel } from "@/components/brand/ImagePanel";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { RoundPhoto } from "@/components/brand/RoundPhoto";

export const metadata: Metadata = { title: "About" };

const rooms = [
  { src: "/home/kitchen.jpg", title: "Kitchen", copy: "Where lunch and dinner are cooked for every marked plate." },
  { src: "/home/spices.jpg", title: "Store", copy: "Rice, dal, oil, and masala the market duty keeps stocked." },
  { src: "/home/hall.jpg", title: "Dining hall", copy: "Members and guests eat from the same service." },
  { src: "/home/market.jpg", title: "Market run", copy: "The morning buy that becomes the day’s expenses." },
];

export default function AboutPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-[96rem] items-center gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#e2b657]">About the house</p>
          <h1 className="mt-3 font-display tracking-tight text-4xl leading-tight text-[#f7f1e4] sm:text-5xl">
            Named for a full plate. Built for the people who share it.
          </h1>
          <p className="mt-6 text-sm leading-7 text-[#cbbfa6]">
            ভুরিভোজ is a full meal. A mess is the room where that meal is shared: a president, managers for the month, and members who eat from the same pot. The list of plates used to live on a wall. The money used to live in a notebook.
          </p>
          <p className="mt-4 text-sm leading-7 text-[#cbbfa6]">
            BhuriBhoj keeps both. The platform watches every mess. Inside one mess, each role sees only its own work. A member does not open the ledger. A manager does not open another house.
          </p>
        </div>
        <div className="flex items-center justify-center bg-[radial-gradient(circle,rgba(226,182,87,0.2),transparent_68%)] py-10">
          <BrandLogo className="h-48 w-48 sm:h-64 sm:w-64 md:h-72 md:w-72" />
        </div>
      </section>

      <section className="border-y border-[#e2b657]/15">
        <div className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-14">
          <h2 className="font-display tracking-tight text-3xl text-[#f7f1e4]">The rooms a mess already has</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((room) => (
              <figure key={room.title} className="flex flex-col items-center text-center">
                <RoundPhoto src={room.src} alt={room.title} />
                <figcaption className="mt-4">
                  <h3 className="font-display tracking-tight text-xl text-[#f7f1e4]">{room.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#cbbfa6]">{room.copy}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-4 py-12 sm:px-8 sm:py-16">
        <ImagePanel src="/home/curry.jpg" alt="A shared pot of food" className="min-h-[28rem]">
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              ["One kitchen", "A subscription belongs to a single mess and the people who eat there. Another house is another plan."],
              ["Four doors", "Admin, president, manager, and member do not share a screen. The work follows the person."],
              ["The month", "Plans, dues, market duty, and manager seats follow the calendar the house already uses."],
              ["The plate first", "Money matters at month end. The daily question is still who eats lunch and who eats dinner."],
            ].map(([title, copy]) => (
              <article key={title}>
                <h2 className="font-display tracking-tight text-2xl text-[#f7f1e4]">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#f7f1e4]/85">{copy}</p>
              </article>
            ))}
          </div>
          <Link href="/contact" className="mt-8 inline-flex w-fit rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f0cb78]">
            Talk about your mess
          </Link>
        </ImagePanel>
      </section>
    </main>
  );
}
