"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

const links = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/plans", label: "Plans" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`marketing sticky top-0 z-40 border-b transition-[background-color,padding,border-color] duration-300 ease-out ${
        scrolled ? "border-[var(--border)] bg-[var(--site)]/80 py-2 backdrop-blur-md" : "border-transparent bg-[var(--site)]/40 py-3"
      }`}
    >
      <div className="m-wrap flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <BrandLogo className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="truncate text-lg font-semibold tracking-tight">
            <span className="bn">ভুরিভোজ</span>
            <span className="ml-2 hidden text-sm font-medium text-[var(--muted)] sm:inline">BhuriBhoj</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={active ? "text-[var(--accent)]" : "hover:text-[var(--text)]"} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="m-btn m-btn-ghost px-4 py-2">
            Sign in
          </Link>
          <Link href="/contact" className="m-btn m-btn-primary px-4 py-2">
            Start your mess
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            className="m-wrap grid gap-2 overflow-hidden pb-4 pt-2 lg:hidden"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-[var(--radius)] px-3 py-3 text-base hover:bg-[var(--surface)]">
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="m-btn m-btn-ghost mt-2">
              Sign in
            </Link>
            <Link href="/contact" className="m-btn m-btn-primary">
              Start your mess
            </Link>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
