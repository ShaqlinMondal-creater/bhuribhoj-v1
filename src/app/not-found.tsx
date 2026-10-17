import type { Metadata } from "next";
import Link from "next/link";
import { LogoLoader } from "@/components/brand/LogoLoader";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#090909] px-5 py-16 text-center text-[#f7f1e4]">
      <div className="flex w-full max-w-lg flex-col items-center">
        <LogoLoader size="md" spin={false} label="BhuriBhoj" />
        <p className="mt-8 text-xs uppercase tracking-[0.28em] text-[#e2b657]">404</p>
        <h1 className="mt-3 font-display tracking-tight text-4xl leading-tight sm:text-5xl">
          This page is not on the table.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-[#cbbfa6]">
          That address does not match a room in the house. The kitchen, the plans, and the sign-in door are still here.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-[#e2b657] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f0cb78]">
            Back to the house
          </Link>
          <Link href="/contact" className="rounded-full border border-[#e2b657]/60 px-5 py-3 text-sm text-[#e2b657] hover:bg-[#e2b657]/10">
            Write to us
          </Link>
        </div>
      </div>
    </main>
  );
}
