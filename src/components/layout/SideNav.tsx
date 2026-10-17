"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

export function SideNav({
  items,
  tone,
}: {
  items: NavItem[];
  tone: "mess" | "admin" | "light";
}) {
  const pathname = usePathname();
  const active =
    tone === "light"
      ? "bg-emerald-50 text-emerald-900"
      : "bg-white/10 text-white";
  const idle =
    tone === "light"
      ? "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      : tone === "mess"
        ? "text-emerald-100/80 hover:bg-white/10 hover:text-white"
        : "text-stone-300 hover:bg-white/10 hover:text-white";

  return (
    <nav className={`flex gap-1 ${tone === "light" ? "flex-row overflow-x-auto" : "flex-1 flex-col"}`}>
      {items.map((item) => {
        const current =
          item.href === "/mess" || item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              current ? active : idle
            }`}
          >
            <Icon name={item.icon} className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
