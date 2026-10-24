export function DetailList({
  rows,
  valueClassName = "max-w-[16rem] break-all text-right font-medium text-stone-900",
}: {
  rows: Array<[string, string]>;
  valueClassName?: string;
}) {
  return (
    <dl className="space-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 text-sm">
          <dt className="text-stone-500">{label}</dt>
          <dd className={valueClassName}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
