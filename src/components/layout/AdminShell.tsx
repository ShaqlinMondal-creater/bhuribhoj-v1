import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon } from "@/components/icons/Icon";
import { SideNav, type NavItem } from "@/components/layout/SideNav";
import { appConfig } from "@/lib/config";
import { initials } from "@/lib/format";
import type { AuthUser } from "@/types/auth";

const items: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "grid" },
  { href: "/admin/messes", label: "Messes", icon: "building" },
  { href: "/admin/invitations", label: "Invitations", icon: "mail" },
];

export function AdminShell({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-stone-950 px-4 py-6 text-stone-50 md:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-stone-100">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{appConfig.name}</p>
              <p className="truncate text-xs text-stone-400">Platform</p>
            </div>
          </div>
          <SideNav items={items} tone="admin" />
          <div className="mt-4">
            <SignOutButton tone="admin" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:px-8">
            <p className="text-sm text-stone-500 md:ml-0">
              Signed in as <span className="font-medium text-stone-800">{user?.name ?? "…"}</span>
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
              {user ? initials(user.name) : ""}
            </span>
          </header>
          <div className="border-b border-stone-200 bg-white px-2 py-2 md:hidden">
            <SideNav items={items} tone="light" />
          </div>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
