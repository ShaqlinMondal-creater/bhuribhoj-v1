"use client";

import { useEffect, useState } from "react";
import { BillDetailDialog } from "@/components/bills/BillDetailDialog";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { FilterBar, FilterDate, FilterSearch, FilterSelect } from "@/components/ui/FilterBar";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { paymentStatusLabel, StatusPill } from "@/components/ui/StatusPill";
import { inr, kolkataDateTime } from "@/lib/format";
import { paymentService, type PaymentRow } from "@/services/paymentService";

export function PaymentsScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<{ mode: "detail" | "delete"; row: PaymentRow } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const from = isDmy(fromDate) ? fromDate : "";
  const to = isDmy(toDate) ? toDate : "";
  const dateOrderError = from && to && compareDmy(from, to) > 0 ? "The end date must be on or after the start date." : null;

  useEffect(() => {
    if (dateOrderError) return;
    let cancelled = false;
    setLoading(true);
    paymentService
      .fetch({
        search: search || undefined,
        status: status || undefined,
        from_date: from || undefined,
        to_date: to || undefined,
        limit,
        offset,
      })
      .then((result) => {
        if (cancelled) return;
        const all = result.data ?? [];
        if (result.count == null) {
          const term = search.toLowerCase();
          const matched = all.filter((row) => {
            const hay = `${row.user?.name ?? ""} ${row.user?.email ?? ""} ${row.plan?.name ?? ""} ${row.razorpay_order_id} ${row.razorpay_payment_id ?? ""}`.toLowerCase();
            return (!status || row.status === status) && (!term || hay.includes(term)) && inDateRange(row.created_at, from, to);
          });
          setCount(matched.length);
          setRows(matched.slice(offset, offset + limit));
        } else {
          setRows(all);
          setCount(result.count);
        }
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load bills.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, status, from, to, dateOrderError, limit, offset, reloadKey]);

  const filtered = search !== "" || status !== "" || from !== "" || to !== "";

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Sites"
        title="Bills"
        description="Each bill kept for a plan, including ones that failed."
      />
      <Flash message={notice} />
      {error || dateOrderError ? <Notice>{error || dateOrderError}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Name, email, plan, or order" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All" },
            { value: "paid", label: "Paid" },
            { value: "failed", label: "Failed" },
            { value: "created", label: "Created" },
          ]}
        />
        <FilterDate label="From" value={fromDate} onChange={(value) => { setFromDate(value); setOffset(0); }} />
        <FilterDate label="To" value={toDate} onChange={(value) => { setToDate(value); setOffset(0); }} />
      </FilterBar>
      <TableShell
        count={count}
        limit={limit}
        offset={offset}
        onLimit={(value) => {
          setLimit(value);
          setOffset(0);
        }}
        onOffset={setOffset}
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
              <TableStatus
                colSpan={6}
                loading={loading && rows.length === 0}
                empty={!loading && rows.length === 0 ? (filtered ? "No bills match these filters." : "No bills yet.") : null}
              />
              {rows.map((row) => (
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
                    <div className="flex justify-end gap-1">
                      <IconButton label="View detail" icon="eye" onClick={() => setOpen({ mode: "detail", row })} />
                      <IconButton label="Delete" icon="trash" onClick={() => setOpen({ mode: "delete", row })} />
                    </div>
                  </td>
                </tr>
              ))}
      </TableShell>

      {open?.mode === "detail" ? <BillDetailDialog row={open.row} showSubscription onClose={() => setOpen(null)} /> : null}
      {open?.mode === "delete" ? (
        <DeleteDialog
          row={open.row}
          onClose={() => setOpen(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            if (offset > 0 && rows.length === 1) setOffset(Math.max(0, offset - limit));
            else setReloadKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
            setOpen(null);
          }}
        />
      ) : null}
    </section>
  );
}

function DeleteDialog({
  row,
  onClose,
  onDeleted,
  onFailed,
}: {
  row: PaymentRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await paymentService.remove(row.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the payment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete bill" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete the {inr(row.amount_inr)} {paymentStatusLabel[row.status] ?? row.status} bill for {row.user?.name ?? "this account"}? The plan subscription stays.
      </p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700">
          Cancel
        </button>
        <button type="button" onClick={onDelete} disabled={pending} className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Dialog>
  );
}

function isDmy(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function compareDmy(left: string, right: string) {
  return isoFromDmy(left).localeCompare(isoFromDmy(right));
}

function isoFromDmy(value: string) {
  if (!isDmy(value)) return "";
  const [day, month, year] = value.split("-");
  return `${year}-${month}-${day}`;
}

function inDateRange(value: string | null, from: string, to: string) {
  if (!from && !to) return true;
  if (!value) return false;
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
  if (from && day < isoFromDmy(from)) return false;
  if (to && day > isoFromDmy(to)) return false;
  return true;
}
