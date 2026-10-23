"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { applyTheme, readTheme, themes, type ThemeId } from "@/lib/theme";

export function SettingsScreen() {
  const [current, setCurrent] = useState<ThemeId>("black-yellow");

  useEffect(() => {
    setCurrent(readTheme());
  }, []);

  function choose(id: ThemeId) {
    applyTheme(id);
    setCurrent(id);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="The look of the public site, the admin panel, and the mess panel. Stored on this browser until the settings API is ready."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {themes.map((theme) => {
          const selected = current === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => choose(theme.id)}
              aria-pressed={selected}
              className={`rounded-2xl border bg-white p-4 text-left transition ${
                selected ? "border-[var(--accent)] shadow-sm" : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <span
                data-preview={theme.id}
                className="theme-preview flex h-28 flex-col justify-between rounded-xl p-4"
              >
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
                  {selected ? "In use" : "Use"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
