import type { Metadata } from "next";
import { RegisterVerifyForm } from "@/components/auth/RegisterVerifyForm";

export const metadata: Metadata = { title: "Verify email" };
export const instant = false;

export default async function RegisterVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">Verify</p>
      <h1 className="mt-2 font-display text-4xl text-[#f7f1e4]">Set your seat</h1>
      <div className="mt-7">
        <RegisterVerifyForm token={token} />
      </div>
    </main>
  );
}
