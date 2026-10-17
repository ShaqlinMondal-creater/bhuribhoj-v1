"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

const links = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/plans", label: "Plans" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#e2b657]/25 bg-black/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-[96rem] grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:px-8 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandLogo className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
          <span className="truncate font-display text-lg text-[#f7f1e4] sm:text-xl">
            BhuriBhoj
          </span>
        </Link>
        <nav className="hidden items-center justify-center gap-8 text-sm text-[#cbbfa6] md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "text-[#e2b657]" : "transition hover:text-[#f7f1e4]"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/login"
          className="justify-self-end shrink-0 rounded-full border border-[#e2b657] bg-[#e2b657] px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#f0cb78] sm:px-4"
        >
          Sign in
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-xs tracking-wide text-[#cbbfa6] md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="shrink-0">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
