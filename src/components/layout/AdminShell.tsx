"use client";

import { PanelShell, type NavGroup } from "@/components/layout/PanelShell";
import type { AuthUser } from "@/types/auth";

const groups: NavGroup[] = [
  { items: [{ href: "/admin", label: "Overview", icon: "grid" }] },
  {
    label: "Sites",
    items: [
      { href: "/admin/plans", label: "Plans", icon: "plans" },
      { href: "/admin/bills", label: "Bills", icon: "receipt" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: "card" },
      { href: "/admin/coupons", label: "Coupons", icon: "ticket" },
    ],
  },
  {
    label: "Mess Details",
    items: [
      { href: "/admin/messes", label: "Messes", icon: "building" },
      { href: "/admin/meals", label: "Meals", icon: "meals" },
      { href: "/admin/daily-meals", label: "Daily Meals", icon: "calendar" },
      { href: "/admin/users", label: "Users", icon: "users" },
    ],
  },
  {
    label: "Action",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "gear" },
      { href: "/admin/configs", label: "Configs", icon: "sliders" },
      { href: "/admin/logs", label: "Logs", icon: "logs" },
    ],
  },
];

export function AdminShell({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  const first = user?.name.split(" ")[0] ?? "";

  return (
    <PanelShell
      storageKey="bhuribhoj-admin-nav"
      groups={groups}
      homeHref="/admin"
      brandCaption="Platform"
      eyebrow="Platform · Admin"
      heading={first ? `Hello, ${first}` : "Admin"}
      profileHref="/admin/profile"
      profileLabel="Profile"
      signOutTone="admin"
      user={user}
    >
      {children}
    </PanelShell>
  );
}
