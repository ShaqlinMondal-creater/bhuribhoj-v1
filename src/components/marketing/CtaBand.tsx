import Link from "next/link";

export function CtaBand() {
  return (
    <section className="marketing">
      <div className="m-wrap py-16 md:py-24">
        <div className="rounded-[var(--radius)] bg-[linear-gradient(120deg,#3a2a0c,#141414_55%,#1a1208)] px-6 py-12 sm:px-10">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Ready to open a house?</h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-[var(--muted)]">
            Tell us the mess name. We will point you to the right door.
          </p>
          <Link href="/contact" className="m-btn m-btn-primary mt-8">
            Start your mess
          </Link>
        </div>
      </div>
    </section>
  );
}
