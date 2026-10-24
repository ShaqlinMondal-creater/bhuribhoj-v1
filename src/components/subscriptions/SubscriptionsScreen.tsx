"use client";

import { useEffect, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { inr } from "@/lib/format";
import { subscriptionService, type SubscriptionRow } from "@/services/subscriptionService";
import { SubscriptionDetailScreen } from "@/components/mess/SubscriptionDetailScreen";
import { CurrentSubscriptionCard } from "@/components/subscriptions/CurrentSubscriptionCard";

const statusLabel: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function MessSubscriptionsScreen() {
  const user = useMessUser();
  if (!user) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;
  if (user.role !== "president") return <SubscriptionDetailScreen />;
  return <SubscriptionsScreen scope="president" />;
}

export function SubscriptionsScreen({ scope }: { scope: "admin" | "president" }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<{ mode: "detail" | "delete"; row: SubscriptionRow } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    subscriptionService
      .fetch(scope, {
        search: search || undefined,
        status: status || undefined,
        limit,
        offset,
      })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data ?? []);
        setCount(result.count ?? result.data?.length ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load subscriptions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope, search, status, limit, offset, reloadKey]);

  const filtered = search !== "" || status !== "";

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow={scope === "admin" ? "Sites" : "Setting"}
        title="Subscriptions"
        description={
          scope === "admin"
            ? "Which mess bought a plan, and how long it runs."
            : "Plans bought for this mess."
        }
      />
      {scope === "president" ? <CurrentSubscriptionCard rows={rows} listLoading={loading} /> : null}
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      {scope === "admin" ? (
        <FilterBar>
          <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Mess, plan, or email" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setOffset(0);
            }}
            options={[
              { value: "", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "active", label: "Active" },
              { value: "expired", label: "Expired" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </FilterBar>
      ) : null}
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
            <th className={thClass()}>Mess</th>
            <th className={thClass()}>Plan</th>
            <th className={thClass()}>Paid</th>
            <th className={thClass()}>Status</th>
            <th className={thClass()}>Starts</th>
            <th className={thClass()}>Ends</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={7}
          loading={loading && rows.length === 0}
          empty={!loading && !error && rows.length === 0 ? (filtered ? "No subscriptions match these filters." : "No subscriptions yet.") : null}
        />
        {rows.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3">
              <p className="font-medium text-stone-950">{row.mess?.name ?? "Not opened"}</p>
              <p className="text-xs text-stone-500">{row.mess?.code ?? row.purchaser?.email ?? "—"}</p>
            </td>
            <td className="px-4 py-3 text-stone-700">
              {row.plan ? `${row.plan.name} · ${months(row.plan.duration_months)}` : "—"}
            </td>
            <td className="px-4 py-3 text-stone-900">{inr(row.amount_paid_inr)}</td>
            <td className="px-4 py-3">
              <SubscriptionStatus status={row.status} />
            </td>
            <td className="px-4 py-3 text-stone-600">{showDate(row.starts_on)}</td>
            <td className="px-4 py-3 text-stone-600">{showDate(row.ends_on)}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <IconButton label="View detail" icon="eye" onClick={() => setOpen({ mode: "detail", row })} />
                {scope === "admin" ? (
                  <IconButton label="Delete" icon="trash" onClick={() => setOpen({ mode: "delete", row })} />
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </TableShell>
      {open?.mode === "detail" ? <DetailDialog row={open.row} onClose={() => setOpen(null)} /> : null}
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

function SubscriptionStatus({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
      : status === "pending"
        ? "bg-amber-500 text-white"
        : status === "cancelled"
          ? "bg-red-600 text-white"
          : "bg-stone-200 text-stone-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{statusLabel[status] ?? status}</span>;
}

function DetailDialog({ row, onClose }: { row: SubscriptionRow; onClose: () => void }) {
  const lines: Array<[string, string]> = [
    ["Mess", row.mess?.name ?? "Not opened"],
    ["Code", row.mess?.code ?? "—"],
    ["Plan", row.plan ? `${row.plan.name} · ${months(row.plan.duration_months)}` : "—"],
    ["Paid", inr(row.amount_paid_inr)],
    ["Status", statusLabel[row.status] ?? row.status],
    ["Starts", showDate(row.starts_on)],
    ["Ends", showDate(row.ends_on)],
    ["Order", row.razorpay_order_id || "—"],
    ["Payment", row.razorpay_payment_id || "—"],
    ["Buyer", row.purchaser?.name ?? "—"],
    ["Email", row.purchaser?.email ?? "—"],
  ];

  return (
    <Dialog title="Subscription detail" onClose={onClose}>
      <DetailList rows={lines} />
    </Dialog>
  );
}

function DeleteDialog({
  row,
  onClose,
  onDeleted,
  onFailed,
}: {
  row: SubscriptionRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await subscriptionService.remove(row.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the subscription.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete subscription" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete the {row.plan?.name ?? "plan"} subscription for {row.mess?.name ?? row.purchaser?.name ?? "this account"}? The payment log stays. This mess loses that plan.
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

function months(count: number) {
  return `${count} ${count === 1 ? "month" : "months"}`;
}

function showDate(value: string | null) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}-${match[2]}-${match[1]}`;
}
