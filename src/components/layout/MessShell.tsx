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
  { href: "/mess/members", label: "Members", icon: "users", roles: ["president", "manager"] },
  { href: "/mess/meals", label: "Meals", icon: "meals", roles: ["president", "manager", "member"] },
  { href: "/mess/expenses", label: "Expenses", icon: "wallet", roles: ["president", "manager", "member"] },
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
    .filter((link) => (user ? link.roles.includes(user.role) : true))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="min-h-screen bg-[#f3f6f4] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-emerald-950 px-4 py-6 text-emerald-50 md:flex">
          <Brand user={user} />
          <SideNav items={items} tone="mess" />
          <div className="mt-4">
            <SignOutButton tone="mess" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
            <Link href="/mess" className="flex items-center gap-2 font-semibold text-emerald-950">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-white">
                <Icon name="mark" />
              </span>
              {appConfig.name}
            </Link>
            <span className="text-xs font-medium text-stone-500">
              {user ? roleLabel[user.role] : "Mess"}
            </span>
          </header>
          <div className="border-b border-stone-200 bg-white px-2 py-2 md:hidden">
            <SideNav items={items} tone="light" />
          </div>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {status ? <p className="mb-4 text-sm text-amber-800">{status}</p> : null}
            {children}
          </main>
        </div>
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

export function UserChip({ user }: { user: AuthUser }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm shadow-stone-900/5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
        {initials(user.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-stone-900">{user.name}</p>
        <p className="text-xs text-stone-500">{roleLabel[user.role]}</p>
      </div>
    </div>
  );
}
