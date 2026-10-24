"use client";

import { PanelShell, type NavGroup } from "@/components/layout/PanelShell";
import { roleLabel } from "@/lib/auth/roles";
import type { AuthUser, Role } from "@/types/auth";

function navGroups(role?: Role): NavGroup[] {
  const setting: NavGroup["items"] = [{ href: "/mess/house", label: "Mess Config", icon: "building" }];
  if (role === "president") {
    setting.push({ href: "/mess/plans", label: "Plans", icon: "plans" });
  }
  setting.push(
    { href: "/mess/subscriptions", label: "Subscriptions", icon: "card" },
    { href: "/mess/bills", label: "Bills", icon: "receipt" },
  );

  return [
    { items: [{ href: "/mess", label: "Dashboard", icon: "grid" }] },
    {
      label: "Mess Details",
      items: [
        { href: "/mess/members", label: "Member", icon: "users" },
        ...(role === "president" ? [{ href: "/mess/deposits", label: "Deposites", icon: "wallet" as const }] : []),
        { href: "/mess/meals", label: "Meals", icon: "meals" },
        { href: "/mess/daily-meals", label: "Daily Meals", icon: "calendar" },
        { href: "/mess/expenses", label: "Expense", icon: "wallet" },
        { href: "/mess/markets", label: "Markets", icon: "market" },
      ],
    },
    { label: "Setting", items: setting },
  ];
}

export function MessShell({
  user,
  status,
  children,
}: {
  user: AuthUser | null;
  status?: string | null;
  children: React.ReactNode;
}) {
  const first = user?.name.split(" ")[0] ?? "";

  return (
    <PanelShell
      storageKey="bhuribhoj-mess-nav"
      groups={navGroups(user?.role)}
      homeHref="/mess"
      brandCaption={user?.mess?.name ?? "Your mess"}
      eyebrow={user ? `${user.mess?.name ?? "Mess"} · ${roleLabel[user.role]}` : "Mess"}
      heading={first ? `Hello, ${first}` : "Dashboard"}
      profileHref="/mess/profile"
      profileLabel={user?.memberCode ?? "Profile"}
      signOutTone="mess"
      user={user}
      notice={status}
    >
      {children}
    </PanelShell>
  );
}
