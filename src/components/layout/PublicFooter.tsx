import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const links = [
  { href: "/features", label: "Features" },
  { href: "/about", label: "About" },
  { href: "/plans", label: "Plans" },
  { href: "/contact", label: "Contact" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-[#e2b657]/20 bg-black text-[#f7f1e4]">
      <div className="mx-auto grid max-w-[96rem] gap-10 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <div>
          <BrandLogo className="h-20 w-20" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#cbbfa6]">
            A private ledger and kitchen book for the mess. Meals, money, and members, held in one house.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">Visit</p>
          <ul className="mt-4 space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[#f7f1e4]/85 hover:text-[#e2b657]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">House</p>
          <ul className="mt-4 space-y-2 text-sm text-[#cbbfa6]">
            <li>Hostel kitchens</li>
            <li>Paying-guest messes</li>
            <li>College dining halls</li>
            <li>Lunch and dinner, one ledger</li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">Open a seat</p>
          <p className="mt-4 text-sm leading-7 text-[#cbbfa6]">
            President, manager, and member each sign in to their own door.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-full border border-[#e2b657] px-4 py-2 text-sm text-[#e2b657] hover:bg-[#e2b657] hover:text-black"
          >
            Sign in
          </Link>
        </div>
      </div>
      <p className="border-t border-[#e2b657]/15 py-4 text-center text-xs tracking-[0.16em] text-[#cbbfa6]">
        ভুরিভোজ · BhuriBhoj
      </p>
    </footer>
  );
}
