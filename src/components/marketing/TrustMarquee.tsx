const tags = [
  "Built for hostels",
  "Paying-guest kitchens",
  "College dining halls",
  "One pot, one ledger",
  "Lunch and dinner",
];

export function TrustMarquee() {
  const row = [...tags, ...tags];

  return (
    <section className="marketing border-y border-[var(--border)] bg-[var(--surface)] py-3.5" aria-label="Who this is for">
      <div className="overflow-hidden">
        <div className="m-marquee flex w-max items-center gap-3 px-4">
          {row.map((tag, index) => (
            <span key={`${tag}-${index}`} className="flex items-center gap-3 text-[0.8rem] font-medium tracking-wide text-[var(--muted)]">
              <span>{tag}</span>
              <span className="text-[var(--accent)]/50" aria-hidden="true">
                ·
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
