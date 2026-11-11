import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PoweredByLiwaas } from "@/components/brand/PoweredByLiwaas";
import { ContactEmailLink } from "@/components/i18n/ContactEmailLink";

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

export function PublicFooter({ contactEmail }: { contactEmail: string }) {
  return (
    <footer className="marketing border-t border-[var(--border)] bg-[var(--site)]">
      <div className="m-wrap grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo className="h-12 w-12" />
            <span className="text-lg font-semibold">
              <span className="bn">ভুরিভোজ</span>
              <span className="ml-2 text-sm font-medium text-[var(--muted)]">BhuriBhoj</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--muted)]">
            A private ledger and kitchen book for the mess. Meals, money, and members, held in one house.
          </p>
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
          <p>© 2026 BhuriBhoj</p>
          <span aria-hidden="true">·</span>
          <PoweredByLiwaas />
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <ContactEmailLink fallback={contactEmail} />
        </div>
      </div>
      <div className="m-wrap grid gap-4 pb-10 text-sm leading-6 text-[var(--muted)] sm:grid-cols-2">
        <p id="privacy">Privacy. A mess ledger is visible to the people of that house, and to the platform admin who keeps the subscriptions.</p>
        <p id="terms">Terms. One subscription covers one mess, for a month, a semester, or a year. The president opens it.</p>
      </div>
    </footer>
  );
}
