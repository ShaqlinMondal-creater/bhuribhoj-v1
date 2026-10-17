import type { Metadata } from "next";
import { RoundPhoto } from "@/components/brand/RoundPhoto";
import { ContactForm } from "@/components/home/ContactForm";

export const metadata: Metadata = { title: "Contact" };

const notes = [
  ["Who should write", "A president opening a house, or a hostel office setting up a kitchen."],
  ["What to include", "Mess name, city, about how many members, and whether you need a month or a year."],
  ["What happens next", "We point you to sign in. The president buys a plan and seats the managers."],
];

export default function ContactPage() {
  return (
    <main>
      <section className="mx-auto grid max-w-[96rem] gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#e2b657]">Write to the house</p>
          <h1 className="mt-3 font-display tracking-tight text-4xl text-[#f7f1e4] sm:text-5xl">Tell us the name of the mess.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#cbbfa6]">
            For a hostel kitchen, a paying-guest mess, or a college dining hall that wants the ledger and the plate list in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <RoundPhoto src="/home/table.jpg" alt="A dining table set for a shared meal" className="h-28 w-28 sm:h-32 sm:w-32" />
            <RoundPhoto src="/home/biryani.jpg" alt="A festive mess meal" className="h-28 w-28 sm:h-32 sm:w-32" />
            <RoundPhoto src="/home/cooking.jpg" alt="Cooking in a shared kitchen" className="h-28 w-28 sm:h-32 sm:w-32" />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-[#e2b657]/30 bg-black/40 p-5 sm:p-8">
          <ContactForm />
        </div>
      </section>
      <section className="border-t border-[#e2b657]/15">
        <div className="mx-auto grid max-w-[96rem] gap-8 px-4 py-12 sm:px-8 md:grid-cols-3">
          {notes.map(([title, copy]) => (
            <article key={title}>
              <h2 className="font-display tracking-tight text-2xl text-[#f7f1e4]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#cbbfa6]">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
