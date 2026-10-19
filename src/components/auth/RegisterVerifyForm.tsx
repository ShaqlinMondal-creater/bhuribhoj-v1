"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { kolkataDateTime } from "@/lib/format";
import { setToken } from "@/lib/auth/token";
import { startSessionAction } from "@/app/actions/auth";
import { authService } from "@/services/authService";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-[#e2b657]/30 bg-black px-4 py-3 text-[#f7f1e4] outline-none focus:border-[#e2b657]";

export function RegisterVerifyForm({ token }: { token: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This verification link is missing a token.");
      return;
    }
    authService
      .registerPreview(token)
      .then((result) => {
        setEmail(result.email);
        setExpiresAt(result.expires_at);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "API unreachable"));
  }, [token]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      const session = await authService.registerComplete({
        token,
        mobile: String(form.get("mobile") ?? ""),
        password: String(form.get("password") ?? ""),
        password_confirmation: String(form.get("password_confirmation") ?? ""),
      });
      setToken(session.token);
      await startSessionAction(session.token, session.user.role, "", session.seat.next);
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      setError(err instanceof ApiError ? err.message : "API unreachable");
      setPending(false);
    }
  }

  if (!email) {
    return (
      <div className="space-y-4">
        {error ? (
          <>
            <p className="rounded-2xl border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-100">{error}</p>
            <Link href="/register" className="inline-block text-sm text-[#e2b657] underline-offset-4 hover:underline">
              Send a new verify email
            </Link>
          </>
        ) : (
          <p className="text-sm text-[#cbbfa6]">Checking the link…</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm leading-6 text-[#cbbfa6]">Add your mobile number and a password for {email}.</p>
      {expiresAt ? <p className="text-sm leading-6 text-[#cbbfa6]">This link is valid until {kolkataDateTime(expiresAt)} IST.</p> : null}
      <label className="block text-xs uppercase tracking-[0.16em] text-[#e2b657]" htmlFor="mobile">
        Mobile
        <input id="mobile" name="mobile" required autoComplete="tel" className={fieldClass} />
      </label>
      <PasswordField id="password" name="password" label="Password" autoComplete="new-password" />
      <PasswordField id="password_confirmation" name="password_confirmation" label="Confirm password" autoComplete="new-password" />
      {error ? <p className="rounded-2xl border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      <button type="submit" disabled={pending || !email} className="w-full rounded-full bg-[#e2b657] px-4 py-3 text-sm font-semibold text-black disabled:opacity-60">
        {pending ? "Saving…" : "Finish registration"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-xs uppercase tracking-[0.16em] text-[#e2b657]" htmlFor={id}>
      {label}
      <span className="relative mt-2 block">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          className={`${fieldClass} mt-0 pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#e2b657]"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 5.5 19 19" />
      <path d="M9.5 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.2-.9" />
      <path d="M6.2 7.4C4.2 8.8 2.5 12 2.5 12S6 17.5 12 17.5c1.4 0 2.6-.3 3.7-.8" />
      <path d="M10 6.7A8 8 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a16 16 0 0 1-2.2 2.8" />
    </svg>
  );
}

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}
