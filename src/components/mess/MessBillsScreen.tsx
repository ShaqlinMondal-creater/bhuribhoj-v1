"use client";

import { useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { BillDetailDialog } from "@/components/bills/BillDetailDialog";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { useApi } from "@/hooks/useApi";
import { inr, kolkataDateTime } from "@/lib/format";
import { paymentService, type PaymentRow } from "@/services/paymentService";

export function MessBillsScreen() {
  const user = useMessUser();
  const bills = useApi(() => paymentService.messBills(user?.role ?? "member"), Boolean(user));
  const all = bills.data?.data ?? [];
  const table = useClientPage(all);
  const [open, setOpen] = useState<PaymentRow | null>(null);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Setting"
        title="Bills"
        description="Payment logs for subscriptions on this mess."
      />
      {bills.error ? <Notice>{bills.error}</Notice> : null}
      <TableShell
        count={table.count}
        limit={table.limit}
        offset={table.offset}
        onLimit={table.setLimit}
        onOffset={table.setOffset}
        head={
          <tr>
            <th className={thClass()}>Who</th>
            <th className={thClass()}>Plan</th>
            <th className={thClass()}>Amount</th>
            <th className={thClass()}>Status</th>
            <th className={thClass()}>When</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus colSpan={6} loading={bills.loading} empty={!bills.loading && table.count === 0 ? "No bills yet." : null} />
        {table.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3">
              <p className="font-medium text-stone-950">{row.user?.name ?? "Unknown"}</p>
              <p className="text-xs text-stone-500">{row.user?.email}</p>
            </td>
            <td className="px-4 py-3 text-stone-700">{row.plan?.name ?? "—"}</td>
            <td className="px-4 py-3 text-stone-900">{inr(row.amount_inr)}</td>
            <td className="px-4 py-3">
              <StatusPill status={row.status} />
            </td>
            <td className="px-4 py-3 text-stone-600">{row.created_at ? kolkataDateTime(row.created_at) : "—"}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end">
                <IconButton label="View detail" icon="eye" onClick={() => setOpen(row)} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>
      {open ? <BillDetailDialog row={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
