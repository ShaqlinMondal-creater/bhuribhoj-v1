import type { Metadata } from "next";
import { ContactForm } from "@/components/home/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell BhuriBhoj the name of the mess, how many members eat there, and how to reach you.",
  openGraph: {
    title: "Contact · BhuriBhoj",
    description: "Open a house for a hostel, paying-guest kitchen, or college dining hall.",
  },
};

export default function ContactPage() {
  return (
    <main className="marketing">
      <section className="m-wrap grid gap-10 py-16 md:py-24 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Write to the house</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Tell us the name of the mess.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--muted)]">
            For a hostel kitchen, a paying-guest mess, or a college dining hall that wants the ledger and the plate list in one place.
          </p>
          <dl className="mt-8 space-y-4 text-sm leading-6 text-[var(--muted)]">
            <div>
              <dt className="font-semibold text-[var(--text)]">Who should write</dt>
              <dd>A president opening a house, or a hostel office setting up a kitchen.</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">What to include</dt>
              <dd>Mess name, how many members, and whether you need a month or a year.</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--text)]">Email</dt>
              <dd>
                <a href="mailto:hello@bhuribhoj.com" className="text-[var(--accent)]">
                  hello@bhuribhoj.com
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
