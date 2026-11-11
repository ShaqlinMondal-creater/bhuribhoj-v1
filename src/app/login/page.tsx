import type { Metadata } from "next";
import Image from "next/image";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { PoweredByLiwaas } from "@/components/brand/PoweredByLiwaas";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

/** Reads ?next= at request time. */
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : "";

  return (
    <main className="relative isolate min-h-[calc(100dvh-4.75rem)] w-full overflow-hidden">
      <Image
        src="/home/hall.jpg"
        alt="The dining hall"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-4.75rem)] w-full max-w-7xl flex-col justify-between gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10 lg:py-12">
        <div className="max-w-lg">
          <BrandLogo className="h-16 w-16 ring-2 ring-[var(--accent)]/50 sm:h-20 sm:w-20" />
          <p className="mt-8 text-xs uppercase tracking-[0.24em] text-[var(--accent)]">The door</p>
          <h1 className="mt-3 font-display tracking-tight text-4xl leading-tight text-[#f7f1e4] sm:text-5xl">
            Your seat is already set.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#f7f1e4]/85">
            Admin, president, manager, and member each sign in to their own door. The house does not share one screen.
          </p>
        </div>

        <section className="w-full max-w-[19.5rem] shrink-0 self-end rounded-2xl border border-[var(--accent)]/35 bg-[#0c0c0c]/88 p-5 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-6 lg:self-center">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Sign in</p>
          <h2 className="mt-1.5 font-display tracking-tight text-2xl text-[#f7f1e4]">Welcome back</h2>
          <p className="mt-1.5 text-xs leading-5 text-[#cbbfa6]">Use the email and password for your seat.</p>
          <div className="mt-5">
            <LoginForm nextPath={nextPath} />
          </div>
          <div className="mt-5 flex justify-center text-xs">
            <PoweredByLiwaas tone="dark" />
          </div>
        </section>
      </div>
    </main>
  );
}
