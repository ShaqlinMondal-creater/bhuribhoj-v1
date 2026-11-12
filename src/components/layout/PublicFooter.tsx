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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <Link href="/" className="flex w-fit shrink-0 flex-col items-center gap-2.5 text-center">
              <BrandLogo className="h-20 w-20 sm:h-24 sm:w-24" />
              <span className="text-base font-semibold leading-tight">
                <span className="bn block">{site.siteNameBn}</span>
                <span className="mt-0.5 block text-sm font-medium text-[var(--muted)]">{site.siteName}</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-7 text-[var(--muted)] sm:pt-2">{site.siteBlurb}</p>
          </div>
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
      <div className="m-wrap flex flex-col gap-3 border-t border-[var(--border)] py-6 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p>{site.siteCopyright}</p>
          <span aria-hidden="true">·</span>
          <PoweredByLiwaas />
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <ContactEmailLink />
        </div>
      </div>
      <div className="m-wrap grid gap-4 pb-10 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
        <p id="privacy">{site.legalPrivacy}</p>
        <p id="terms">{site.legalTerms}</p>
      </div>
    </footer>
  );
}
