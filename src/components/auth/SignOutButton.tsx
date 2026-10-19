"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSessionAction } from "@/app/actions/auth";
import { Icon } from "@/components/icons/Icon";
import { clearToken } from "@/lib/auth/token";
import { authService } from "@/services/authService";

export function SignOutButton({
  tone,
  iconOnly = false,
}: {
  tone: "mess" | "admin";
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const className = iconOnly
    ? "flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-100 hover:text-stone-950 disabled:opacity-60"
    : tone === "mess"
      ? "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-emerald-100/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
      : "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-stone-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60";

  async function onClick() {
    setPending(true);
    try {
      await authService.logout();
    } catch {
      // The token may already be invalid. Local session still clears.
    }
    clearToken();
    await clearSessionAction();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={className}
      aria-label={iconOnly ? (pending ? "Signing out" : "Sign out") : undefined}
      title={iconOnly ? "Sign out" : undefined}
    >
      <Icon name="logout" />
      {iconOnly ? null : pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
