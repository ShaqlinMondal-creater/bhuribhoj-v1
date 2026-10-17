"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { setToken } from "@/lib/auth/token";
import { startSessionAction } from "@/app/actions/auth";
import { authService } from "@/services/authService";

export function LoginForm({ nextPath = "" }: { nextPath?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const session = await authService.login(email, password);
      setToken(session.token);
      await startSessionAction(session.token, session.user.role, nextPath);
    } catch (err) {
      if (isNextRedirect(err)) throw err;
      setError(err instanceof ApiError ? err.message : "API unreachable");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-[#e2b657]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 w-full rounded-2xl border border-[#e2b657]/30 bg-black px-4 py-3 text-[#f7f1e4] outline-none focus:border-[#e2b657]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs uppercase tracking-[0.16em] text-[#e2b657]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="mt-2 w-full rounded-2xl border border-[#e2b657]/30 bg-black px-4 py-3 text-[#f7f1e4] outline-none focus:border-[#e2b657]"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/40 bg-red-950/50 px-3 py-2 text-sm text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full rounded-full bg-[#e2b657] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#f0cb78] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
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
