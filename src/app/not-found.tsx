import type { Metadata } from "next";
import { UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicSplash } from "@/components/brand/PublicSplash";
import { marketingBengali, marketingSans } from "@/lib/marketingFonts";

export const metadata: Metadata = {
  title: { absolute: "Page not found" },
  description: "That address is not a room in the BhuriBhoj house.",
};

const links = [
  { href: "/features", label: "Features" },
  { href: "/plans", label: "Plans" },
  { href: "/about", label: "About" },
];

export default function NotFound() {
  return (
    <div className={`${marketingSans.variable} ${marketingBengali.variable} flex min-h-dvh flex-col bg-[#090909] text-[#f6f3ec]`}>
      <PublicHeader />
      <PublicSplash />
      <main className="marketing flex flex-1 items-center">
        <div className="m-wrap grid w-full place-items-center py-16 text-center">
          <div className="flex flex-col items-center">
            <div className="m-logo-ring grid h-24 w-24 place-items-center rounded-full">
              <Image src="/no-bg.png" alt="ভুরিভোজ" width={80} height={80} className="m-float h-20 w-20 rounded-full object-cover" />
            </div>
            <UtensilsCrossed className="m-float mt-6 text-[var(--accent)]" size={28} aria-hidden="true" />
            <p className="mt-4 text-6xl font-semibold tracking-tight sm:text-8xl">404</p>
            <h1 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">This room isn&apos;t in the house.</h1>
            <p className="mt-3 max-w-md text-base leading-7 text-[var(--muted)]">
              That address does not match a page. The kitchen, the plans, and the front door are still here.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/" className="m-btn m-btn-primary">
                Back to home
              </Link>
              <Link href="/contact" className="m-btn m-btn-ghost">
                Contact us
              </Link>
            </div>
            <nav aria-label="Helpful pages" className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="text-[var(--muted)] hover:text-[var(--text)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
