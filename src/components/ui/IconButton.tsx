import { Icon, type IconName } from "@/components/icons/Icon";

export function IconButton({
  label,
  icon,
  onClick,
  iconClassName = "h-4 w-4",
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-[var(--accent-soft)] hover:text-[var(--brand)]"
    >
      <Icon name={icon} className={iconClassName} />
    </button>
  );
}
