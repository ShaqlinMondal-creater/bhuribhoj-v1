"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { usePublicSite } from "@/hooks/usePublicSite";

const links = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/plans", label: "Plans" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const { site } = usePublicSite();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";
  const overHero = isHome && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
      className={`marketing z-40 border-b transition-[background-color,padding,border-color,backdrop-filter] duration-300 ease-out ${
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0"
      } ${
        overHero
          ? "border-transparent bg-gradient-to-b from-black/60 via-black/25 to-transparent py-4"
          : "border-[var(--border)] bg-[var(--site)]/85 py-2 backdrop-blur-md"
      }`}
    >
      <div className="m-wrap flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <BrandLogo className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="truncate text-lg font-semibold tracking-tight">
            {site.siteNameBn ? <span className="bn">{site.siteNameBn}</span> : null}
            <span
              className={`font-medium sm:inline ${
                site.siteNameBn ? "ml-2 hidden text-sm text-white/70" : "text-base"
              } ${overHero ? "text-white/70" : "text-[var(--muted)]"}`}
            >
              {site.siteName}
            </span>
          </span>
        </Link>

        <nav
          className={`hidden items-center gap-8 text-sm lg:flex ${overHero ? "text-white/70" : "text-[var(--muted)]"}`}
          aria-label="Primary"
        >
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "text-[var(--accent)]"
                    : overHero
                      ? "hover:text-white"
                      : "hover:text-[var(--text)]"
                }
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className={`m-btn px-4 py-2 ${
              overHero ? "m-btn-ghost border-white/25 text-white hover:border-[var(--accent)]" : "m-btn-ghost"
            }`}
          >
            Sign in
          </Link>
          <Link href="/contact" className="m-btn m-btn-primary px-4 py-2">
            Start your mess
          </Link>
        </div>

        <button
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border lg:hidden ${
            overHero ? "border-white/30 text-white" : "border-[var(--border)]"
          }`}
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
            className="m-wrap grid gap-2 overflow-hidden bg-[var(--site)] pb-4 pt-2 lg:hidden"
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
