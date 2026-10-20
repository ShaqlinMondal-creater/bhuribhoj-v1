"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/errors";
import { kolkataDateTime } from "@/lib/format";
import { setToken } from "@/lib/auth/token";
import { startSessionAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
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
  return (
    <label className="block text-xs uppercase tracking-[0.16em] text-[#e2b657]" htmlFor={id}>
      {label}
      <PasswordInput
        id={id}
        name={name}
        required
        minLength={8}
        autoComplete={autoComplete}
        tone="dark"
        toggleLabel={label.toLowerCase()}
        className={fieldClass}
      />
    </label>
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
