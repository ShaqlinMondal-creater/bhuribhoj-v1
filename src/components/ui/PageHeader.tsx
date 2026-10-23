export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">{title}</h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-stone-500">{description}</p>
      ) : null}
    </header>
  );
}
