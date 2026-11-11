"use client";

import { PanelShell, type NavGroup } from "@/components/layout/PanelShell";
import { roleLabel } from "@/lib/auth/roles";
import type { AuthUser, Role } from "@/types/auth";

function navGroups(role?: Role): NavGroup[] {
  const president = role === "president";
  const manager = role === "manager";
  const lead = president || manager;

  const details: NavGroup["items"] = [];
  if (lead) {
    details.push({ href: "/mess/members", label: "Members", icon: "users" });
  }
  if (president) {
    details.push({ href: "/mess/deposits", label: "Deposits", icon: "wallet" });
  }
  details.push(
    { href: "/mess/meals", label: "Meals", icon: "meals" },
    { href: "/mess/daily-meals", label: "Daily Meals", icon: "calendar" },
    { href: "/mess/expenses", label: "Expenses", icon: "receipt" },
    { href: "/mess/markets", label: "Markets", icon: "market" },
  );

  const setting: NavGroup["items"] = [{ href: "/mess/house", label: "Mess Config", icon: "building" }];
  if (president) {
    setting.push({ href: "/mess/plans", label: "Plans", icon: "plans" });
  }
  setting.push(
    { href: "/mess/subscriptions", label: "Subscriptions", icon: "card" },
    { href: "/mess/bills", label: "Bills", icon: "receipt" },
  );

  return [
    { items: [{ href: "/mess", label: "Dashboard", icon: "grid" }] },
    { label: "Mess Details", items: details },
    { label: "Setting", items: setting },
  ];
}

export function MessShell({
  user,
  role,
  status,
  children,
}: {
  user: AuthUser | null;
  role?: Role;
  status?: string | null;
  children: React.ReactNode;
}) {
  const first = user?.name.split(" ")[0] ?? "";
  const navRole = user?.role ?? role;

  return (
    <PanelShell
      storageKey="bhuribhoj-mess-nav"
      groups={navGroups(navRole)}
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
