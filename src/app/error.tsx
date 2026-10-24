"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const panel = pathname.startsWith("/admin") || pathname.startsWith("/mess");

  if (panel) {
    return (
      <main className="grid min-h-[50vh] place-items-center px-6 py-24 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">This page did not finish loading.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="marketing">
      <section className="m-wrap grid min-h-[50vh] place-items-center py-24 text-center">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">The house</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[var(--muted)]">
            This page did not finish loading. You can try it again, or go back to the front door.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" className="m-btn m-btn-primary" onClick={() => reset()}>
              Try again
            </button>
            <Link href="/" className="m-btn m-btn-ghost">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
