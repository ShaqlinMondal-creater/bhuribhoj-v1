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
    <section className="marketing border-y border-[var(--border)] bg-[var(--surface)] py-4" aria-label="Who this is for">
      <div className="overflow-hidden">
        <div className="m-marquee flex w-max gap-8 px-4">
          {row.map((tag, index) => (
            <span key={`${tag}-${index}`} className="text-sm font-medium text-[var(--muted)]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
