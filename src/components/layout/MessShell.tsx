import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon } from "@/components/icons/Icon";
import { SideNav, type NavItem } from "@/components/layout/SideNav";
import { roleLabel } from "@/lib/auth/roles";
import { appConfig } from "@/lib/config";
import { initials } from "@/lib/format";
import type { AuthUser, Role } from "@/types/auth";

const links: Array<NavItem & { roles: Role[] }> = [
  { href: "/mess", label: "Dashboard", icon: "grid", roles: ["president", "manager", "member"] },
  { href: "/mess/plans", label: "Plans", icon: "plans", roles: ["president"] },
  { href: "/mess/members", label: "Members", icon: "users", roles: ["president", "manager"] },
  { href: "/mess/meals", label: "Meals", icon: "meals", roles: ["president", "manager", "member"] },
  { href: "/mess/expenses", label: "Expenses", icon: "wallet", roles: ["president", "manager", "member"] },
  { href: "/mess/house", label: "House", icon: "building", roles: ["president", "manager"] },
];

export function MessShell({
  user,
  status,
  children,
}: {
  user: AuthUser | null;
  status?: string | null;
  children: React.ReactNode;
}) {
  const items = links
    .filter((link) => (user ? link.roles.includes(user.role) : link.roles.includes("member")))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="min-h-dvh bg-[var(--page)] text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-emerald-950 px-4 py-6 text-emerald-50 md:flex">
        <Brand user={user} />
        <SideNav items={items} tone="mess" />
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col md:pl-64">
          <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800/80">
                  {user ? `${user.mess?.name ?? "Mess"} · ${roleLabel[user.role]}` : "Mess"}
                </p>
                <p className="truncate text-lg font-semibold tracking-tight text-stone-950">
                  {user ? `Hello, ${user.name.split(" ")[0]}` : "Dashboard"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/mess/profile"
                  className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-stone-100"
                >
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-800 text-xs font-semibold text-white">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : user ? (
                      initials(user.name)
                    ) : (
                      ""
                    )}
                  </span>
                  <span className="text-sm font-medium text-stone-800">
                    {user?.memberCode ?? "Profile"}
                  </span>
                </Link>
                <SignOutButton tone="mess" iconOnly />
              </div>
            </div>
            <div className="border-t border-stone-100 px-2 py-2 md:hidden">
              <SideNav items={items} tone="light" />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {status ? <p className="mb-4 text-sm text-amber-800">{status}</p> : null}
            {children}
          </main>
      </div>
    </div>
  );
}

function Brand({ user }: { user: AuthUser | null }) {
  return (
    <div className="mb-8 flex items-center gap-3 px-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-emerald-50">
        <Icon name="mark" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{appConfig.name}</p>
        <p className="truncate text-xs text-emerald-200/80">
          {user?.mess?.name ?? "Your mess"}
        </p>
      </div>
    </div>
  );
}

