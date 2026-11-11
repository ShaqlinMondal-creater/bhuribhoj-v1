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
    <main className="mx-auto grid w-full max-w-[96rem] items-stretch gap-5 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-2 lg:py-16">
      <section className="relative min-h-72 overflow-hidden rounded-[1.75rem] lg:min-h-[40rem]">
        <Image src="/home/hall.jpg" alt="The dining hall" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
          <BrandLogo className="h-16 w-16 ring-2 ring-[var(--accent)]/50 sm:h-20 sm:w-20" />
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">The door</p>
            <h1 className="mt-3 max-w-md font-display tracking-tight text-4xl leading-tight text-[#f7f1e4] sm:text-5xl">
              Your seat is already set.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#f7f1e4]/85">
              Admin, president, manager, and member each sign in to their own door. The house does not share one screen.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-center rounded-[1.75rem] border border-[var(--accent)]/30 bg-[#0c0c0c] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Sign in</p>
        <h2 className="mt-2 font-display tracking-tight text-4xl text-[#f7f1e4]">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-[#cbbfa6]">Use the email and password for your seat.</p>
        <div className="mt-7">
          <LoginForm nextPath={nextPath} />
        </div>
        <div className="mt-8 flex justify-center text-xs">
          <PoweredByLiwaas tone="dark" />
        </div>
      </section>
    </main>
  );
}
