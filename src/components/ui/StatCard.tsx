import { Icon, type IconName } from "@/components/icons/Icon";

export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: IconName;
}) {
  return (
    <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm shadow-stone-900/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
          <Icon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">{value}</p>
    </article>
  );
}
