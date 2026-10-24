"use client";

import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import type { MessRecord } from "@/lib/api/mess";
import { messService } from "@/services/messService";

export function MessesScreen() {
  const { data, error, loading } = useApi(messService.fetch);
  const table = useClientPage(normalizeMesses(data));

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Platform" title="Messes" description="Every mess registered on BhuriBhoj." />
      {error ? <Notice>{error}</Notice> : null}
      <TableShell
        count={table.count}
        limit={table.limit}
        offset={table.offset}
        onLimit={table.setLimit}
        onOffset={table.setOffset}
        head={
          <tr>
            <th className={thClass()}>Mess</th>
            <th className={thClass()}>Code</th>
            <th className={thClass()}>Address</th>
            <th className={thClass()}>Contact</th>
            <th className={thClass()}>Status</th>
          </tr>
        }
      >
        <TableStatus colSpan={5} loading={loading} empty={!loading && table.count === 0 ? "No messes yet." : null} />
        {table.page.map((mess) => (
          <tr key={mess.id} className={rowClass}>
            <td className="px-4 py-3 font-medium text-stone-950">{mess.name}</td>
            <td className="px-4 py-3 text-stone-600">{mess.code}</td>
            <td className="px-4 py-3 text-stone-600">
              {mess.address}, {mess.district} {mess.pincode}
            </td>
            <td className="px-4 py-3 text-stone-600">{mess.email || mess.contact_no || "—"}</td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${mess.is_active ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-stone-100 text-stone-500"}`}>
                {mess.is_active ? "Active" : "Inactive"}
              </span>
            </td>
          </tr>
        ))}
      </TableShell>
    </section>
  );
}

function normalizeMesses(payload: { data?: MessRecord[] } | MessRecord | null): MessRecord[] {
  if (!payload) return [];
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("id" in payload) return [payload];
  return [];
}
