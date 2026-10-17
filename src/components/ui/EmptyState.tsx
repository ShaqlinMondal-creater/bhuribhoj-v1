import { Icon, type IconName } from "@/components/icons/Icon";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-stone-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
