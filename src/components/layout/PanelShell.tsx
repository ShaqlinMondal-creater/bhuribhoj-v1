"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Icon, type IconName } from "@/components/icons/Icon";
import { appConfig } from "@/lib/config";
import { initials } from "@/lib/format";
import type { AuthUser } from "@/types/auth";

export type NavItem = { href: string; label: string; icon: IconName };
export type NavGroup = { label?: string; items: NavItem[] };

export function PanelShell({
  storageKey,
  groups,
  homeHref,
  brandCaption,
  eyebrow,
  heading,
  profileHref,
  profileLabel,
  signOutTone,
  user,
  notice,
  children,
}: {
  storageKey: string;
  groups: NavGroup[];
  homeHref: string;
  brandCaption: string;
  eyebrow: string;
  heading: string;
  profileHref: string;
  profileLabel: string;
  signOutTone: "admin" | "mess";
  user: AuthUser | null;
  notice?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const onProfile = pathname === profileHref;

  useEffect(() => {
    if (localStorage.getItem(storageKey) === "closed") setOpen(false);
  }, [storageKey]);

  function toggle() {
    setOpen((value) => {
      const next = !value;
      localStorage.setItem(storageKey, next ? "open" : "closed");
      return next;
    });
  }

  return (
    <div className="min-h-dvh bg-[var(--page)] text-stone-900">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-[var(--panel)] px-3 py-5 text-[var(--panel-ink)] transition-[width] duration-200 md:flex ${
          open ? "w-64" : "w-[4.75rem]"
        }`}
      >
        <div className={`mb-6 flex ${open ? "items-center justify-between gap-2 px-1" : "flex-col items-center gap-3"}`}>
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo className="h-10 w-10 shrink-0" />
            {open ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{appConfig.name}</p>
                <p className="truncate text-xs text-[var(--panel-muted)]">{brandCaption}</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--panel-muted)] transition hover:bg-white/10 hover:text-[var(--panel-ink)]"
          >
            <Icon name="panel" className={`h-4 w-4 transition ${open ? "" : "rotate-180"}`} />
          </button>
        </div>
        <PanelNav groups={groups} homeHref={homeHref} open={open} onNavigate={() => undefined} />
      </aside>

      <div
        className={`flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200 ${
          open ? "md:pl-64" : "md:pl-[4.75rem]"
        }`}
      >
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenu((value) => !value)}
                aria-label={menu ? "Close menu" : "Open menu"}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 text-stone-700 md:hidden"
              >
                <Icon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">{eyebrow}</p>
                <p className="truncate text-lg font-semibold tracking-tight text-stone-950">{heading}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={profileHref}
                aria-current={onProfile ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-stone-100 ${
                  onProfile ? "bg-stone-100" : ""
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-xs font-semibold text-[var(--accent-ink)]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : user ? (
                    initials(user.name)
                  ) : (
                    ""
                  )}
                </span>
                <span className="text-sm font-medium text-stone-800">{profileLabel}</span>
              </Link>
              <SignOutButton tone={signOutTone} iconOnly />
            </div>
          </div>
          {menu ? (
            <div className="border-t border-stone-100 px-3 py-3 md:hidden">
              <PanelNav groups={groups} homeHref={homeHref} open tone="light" onNavigate={() => setMenu(false)} />
            </div>
          ) : null}
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {notice ? <p className="mb-4 text-sm text-amber-800">{notice}</p> : null}
          {children}
        </main>
      </div>
    </div>
  );
}

function PanelNav({
  groups,
  homeHref,
  open,
  tone = "panel",
  onNavigate,
}: {
  groups: NavGroup[];
  homeHref: string;
  open: boolean;
  tone?: "panel" | "light";
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = tone === "light" ? "bg-[var(--accent-soft)] text-[var(--brand)]" : "bg-white/10 text-[var(--accent)]";
  const idle =
    tone === "light"
      ? "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      : "text-[var(--panel-muted)] hover:bg-white/10 hover:text-[var(--panel-ink)]";
  const labelTone = tone === "light" ? "text-stone-400" : "text-[var(--panel-muted)]";

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.label ?? group.items[0]?.href ?? "nav"}>
          {group.label && open ? (
            <p className={`px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] ${labelTone}`}>{group.label}</p>
          ) : null}
          {group.label && !open ? <div className={`mx-2 my-2 h-px ${tone === "light" ? "bg-stone-200" : "bg-white/10"}`} /> : null}
          {group.items.map((item) => {
            const current = item.href === homeHref ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
                className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition ${
                  open ? "gap-2.5 px-3" : "justify-center px-0"
                } ${current ? active : idle}`}
              >
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                {open ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
