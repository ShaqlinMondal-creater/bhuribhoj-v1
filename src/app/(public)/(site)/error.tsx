"use client";

import Link from "next/link";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
