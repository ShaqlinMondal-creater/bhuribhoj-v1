"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { authService } from "@/services/authService";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-[#e2b657]/30 bg-black px-4 py-3 text-[#f7f1e4] outline-none focus:border-[#e2b657]";

export function RegisterEmailForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function send(email: string) {
    setError(null);
    setPending(true);
    try {
      await authService.registerEmail(email);
      setSentTo(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "API unreachable");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    await send(email);
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[#cbbfa6]">
          We sent a verify link to <span className="text-[#f7f1e4]">{sentTo}</span>. Open that email to set your mobile number and password. The link expires in 24 hours.
        </p>
        <p className="text-sm leading-6 text-[#cbbfa6]">If it is not in the inbox, check spam. Sending again replaces the previous link.</p>
        {error ? <p className="rounded-2xl border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-100">{error}</p> : null}
        <button type="button" disabled={pending} onClick={() => send(sentTo)} className="w-full rounded-full bg-[#e2b657] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60">
          {pending ? "Sending…" : "Send the link again"}
        </button>
        <button type="button" onClick={() => { setSentTo(null); setError(null); }} className="w-full text-sm text-[#e2b657] underline-offset-4 hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm leading-6 text-[#cbbfa6]">Enter your email. We will send a verify link.</p>
      <label className="block text-xs uppercase tracking-[0.16em] text-[#e2b657]" htmlFor="email">
        Email
        <input id="email" name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      {error ? <p className="rounded-2xl border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-[#e2b657] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60">
        {pending ? "Sending…" : "Send verify email"}
      </button>
      <p className="text-center text-sm text-[#cbbfa6]">
        <Link href="/login" className="text-[#e2b657] underline-offset-4 hover:underline">
          Already have an account
        </Link>
      </p>
    </form>
  );
}
