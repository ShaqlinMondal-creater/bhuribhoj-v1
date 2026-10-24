"use client";

import { useEffect, useRef, useState } from "react";
import { BillDetailDialog } from "@/components/bills/BillDetailDialog";
import { Icon } from "@/components/icons/Icon";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { paymentStatusLabel, StatusPill } from "@/components/ui/StatusPill";
import { inr, kolkataDateTime } from "@/lib/format";
import { paymentService, type PaymentRow } from "@/services/paymentService";

const controlClass =
  "h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-[var(--accent)]";

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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
        <label className="relative min-w-56 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <SearchIcon />
          </span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Name, email, plan, or order"
            className={`${controlClass} w-full pl-10`}
          />
        </label>
        <select
          value={status}
          aria-label="Status"
          onChange={(event) => {
            setStatus(event.target.value);
            setOffset(0);
          }}
          className={`${controlClass} min-w-36`}
        >
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="created">Created</option>
        </select>
        <DateField label="From" value={fromDate} onChange={(value) => { setFromDate(value); setOffset(0); }} />
        <DateField label="To" value={toDate} onChange={(value) => { setToDate(value); setOffset(0); }} />
      </div>
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

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const picker = useRef<HTMLInputElement>(null);

  return (
    <div className={`${controlClass} flex min-w-44 items-center gap-2`}>
      <span className="text-xs text-stone-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="dd-mm-yyyy"
        inputMode="numeric"
        aria-label={label}
        className="w-28 bg-transparent outline-none placeholder:text-stone-400"
      />
      <button
        type="button"
        aria-label={`Choose ${label} date`}
        onClick={() => {
          const input = picker.current;
          if (!input) return;
          if (typeof input.showPicker === "function") input.showPicker();
          else input.click();
        }}
        className="text-stone-400"
      >
        <Icon name="calendar" className="h-4 w-4" />
      </button>
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        value={isoFromDmy(value)}
        onChange={(event) => onChange(dmyFromIso(event.target.value))}
        className="sr-only"
      />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
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

function dmyFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
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
