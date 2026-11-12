"use client";

import Link from "next/link";
import { usePublicSite } from "@/hooks/usePublicSite";
import { parseLegalContent } from "@/lib/legalContent";

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { site, ready, failed } = usePublicSite();
  const title = kind === "privacy" ? "Privacy" : "Terms";
  const raw = kind === "privacy" ? site.legalPrivacy : site.legalTerms;
  const blocks = parseLegalContent(raw);

  return (
    <main className="marketing">
      <section className="m-wrap max-w-3xl py-16 md:py-24">
        <p className="text-sm font-medium text-[var(--accent)]">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {ready && failed ? (
          <p className="mt-8 text-base leading-8 text-[var(--muted)]">
            Could not load the latest {title.toLowerCase()} text. Refresh the page, or try again in a moment.
          </p>
        ) : ready ? (
          <div className="mt-10 space-y-6">
            {blocks.map((block, index) =>
              block.type === "heading" ? (
                <h2 key={`${block.type}-${index}`} className="pt-2 text-xl font-semibold tracking-tight text-[var(--text)]">
                  {block.text}
                </h2>
              ) : (
                <p key={`${block.type}-${index}`} className="text-base leading-8 text-[var(--muted)]">
                  {block.text}
                </p>
              ),
            )}
          </div>
        ) : (
          <div className="mt-8 h-28 animate-pulse rounded-2xl bg-[var(--surface)]" />
        )}
        <p className="mt-12">
          <Link href="/" className="text-sm font-medium text-[var(--accent)] hover:underline">
            Back to home
          </Link>
        </p>
      </section>
    </main>
  );
}
