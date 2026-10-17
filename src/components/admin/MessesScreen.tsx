"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { MessRecord } from "@/lib/api/mess";
import { messService } from "@/services/messService";

export function MessesScreen() {
  const { data, error, loading } = useApi(messService.fetch);
  const rows = normalizeMesses(data);

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Platform" title="Messes" description="Every mess registered on BhuriBhoj." />
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState icon="building" title="No messes yet" description="An accepted invitation creates the first mess." />
      ) : null}
      {rows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((mess) => (
            <article key={mess.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">{mess.name}</h2>
                  <p className="mt-1 text-sm text-stone-500">{mess.code}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${mess.is_active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>
                  {mess.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-4 text-sm text-stone-600">
                {mess.address}, {mess.district} {mess.pincode}
              </p>
              <p className="mt-1 text-sm text-stone-500">{mess.email}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function normalizeMesses(payload: { data?: MessRecord[] } | MessRecord | null): MessRecord[] {
  if (!payload) return [];
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("id" in payload) return [payload];
  return [];
}
