"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PoweredByLiwaas } from "@/components/brand/PoweredByLiwaas";
import { ContactEmailLink } from "@/components/i18n/ContactEmailLink";
import { usePublicSite } from "@/hooks/usePublicSite";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/plans", label: "Plans" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "House",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function PublicFooter() {
  const { site } = usePublicSite();

  return (
    <footer className="marketing border-t border-[var(--border)] bg-[var(--site)]">
      <div className="m-wrap grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-start gap-4 sm:gap-5">
            <BrandLogo className="h-24 w-24 shrink-0 sm:h-36 sm:w-36" />
            <span className="min-w-0 pt-2 sm:pt-3">
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xl font-semibold leading-tight sm:text-2xl">
                {site.siteNameBn ? <span className="bn">{site.siteNameBn}</span> : null}
                <span className={`font-medium ${site.siteNameBn ? "text-base text-[var(--muted)] sm:text-lg" : ""}`}>
                  {site.siteName}
                </span>
              </span>
              <span className="mt-3 block max-w-md text-sm leading-7 text-[var(--muted)] sm:mt-4 sm:text-[0.95rem] sm:leading-8">
                {site.siteBlurb}
              </span>
            </span>
          </Link>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--muted)] hover:text-[var(--text)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="m-wrap flex flex-col gap-3 border-t border-[var(--border)] py-6 pb-10 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p>{site.siteCopyright}</p>
          <span aria-hidden="true">·</span>
          <PoweredByLiwaas />
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-[var(--text)]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[var(--text)]">
            Terms
          </Link>
          <ContactEmailLink />
        </div>
      </div>
    </footer>
  );
}
