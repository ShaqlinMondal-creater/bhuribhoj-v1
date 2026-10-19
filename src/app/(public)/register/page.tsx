import type { Metadata } from "next";
import { RegisterEmailForm } from "@/components/auth/RegisterEmailForm";

export const metadata: Metadata = { title: "Register" };
export const instant = false;

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.22em] text-[#e2b657]">Register</p>
      <h1 className="mt-2 font-display text-4xl text-[#f7f1e4]">Open your mess</h1>
      <div className="mt-7">
        <RegisterEmailForm />
      </div>
    </main>
  );
}
