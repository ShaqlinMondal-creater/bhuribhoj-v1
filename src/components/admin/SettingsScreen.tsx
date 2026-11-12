"use client";

import { useEffect, useState } from "react";
import { Flash } from "@/components/ui/Flash";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { applyTheme, isThemeId, themes, type ThemeId } from "@/lib/theme";
import { settingService } from "@/services/settingService";

export function SettingsScreen() {
  const [current, setCurrent] = useState<ThemeId>("black-yellow");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    settingService
      .fetch()
      .then((result) => {
        if (cancelled) return;
        const theme = result.data?.theme;
        if (isThemeId(theme)) {
          applyTheme(theme);
          setCurrent(theme);
        }
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(id: ThemeId) {
    if (pending || id === current) return;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await settingService.save({ theme: id });
      const theme = isThemeId(result.data?.theme) ? result.data.theme : id;
      applyTheme(theme);
      setCurrent(theme);
      setNotice(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="Theme for the public site, admin panel, and mess panel. Site text and contact email live under Configs."
      />
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {themes.map((theme) => {
          const selected = current === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              disabled={pending || loading}
              onClick={() => void choose(theme.id)}
              aria-pressed={selected}
              className={`rounded-2xl border bg-white p-4 text-left transition disabled:opacity-60 ${
                selected ? "border-[var(--accent)] shadow-sm" : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <span data-preview={theme.id} className="theme-preview flex h-28 flex-col justify-between rounded-xl p-4">
                <span className="flex items-center justify-between">
                  <span className="text-sm font-semibold">BhuriBhoj</span>
                  <span className="theme-preview-pill rounded-full px-2.5 py-1 text-[11px] font-semibold">Active</span>
                </span>
                <span className="text-2xl font-semibold theme-preview-price">₹99</span>
              </span>
              <span className="mt-4 flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold text-stone-950">{theme.name}</span>
                  <span className="mt-1 block text-sm text-stone-500">{theme.note}</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selected ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {pending && !selected ? "…" : selected ? "In use" : "Use"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
