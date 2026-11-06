"use client";

import { useEffect, useState } from "react";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { couponService, type CouponRow, type CouponWrite } from "@/services/couponService";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

export function CouponsScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<CouponRow[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<{ mode: "create" | "detail" | "update" | "delete"; row?: CouponRow } | null>(null);
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
    couponService
      .fetch({
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load coupons.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, status, limit, offset, reloadKey]);

  const filtered = search !== "" || status !== "";

  function refresh() {
    setReloadKey((value) => value + 1);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow="Sites" title="Coupons" description="Codes that change the price of a plan." />
        <button
          type="button"
          onClick={() => setOpen({ mode: "create" })}
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Add coupon
        </button>
      </div>
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Code or note" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
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
            <th className={thClass()}>Code</th>
            <th className={thClass()}>Discount</th>
            <th className={thClass()}>Validity</th>
            <th className={thClass()}>Uses</th>
            <th className={thClass()}>Status</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={6}
          loading={loading && rows.length === 0}
          empty={!loading && rows.length === 0 ? (filtered ? "No coupons match these filters." : "No coupons yet.") : null}
        />
        {rows.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium text-stone-950">{row.code}</td>
            <td className="px-4 py-3 text-stone-700">{discountLabel(row)}</td>
            <td className="px-4 py-3 text-stone-600">{validityLabel(row)}</td>
            <td className="px-4 py-3 text-stone-600">
              {row.used_count}
              {row.usage_limit != null ? ` / ${row.usage_limit}` : ""}
            </td>
            <td className="px-4 py-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.is_active ? "bg-[var(--accent-soft)] text-[var(--brand)]" : "bg-stone-100 text-stone-500"}`}>
                {row.is_active ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <IconButton label="Detail" icon="eye" onClick={() => setOpen({ mode: "detail", row })} />
                <IconButton label="Update" icon="pencil" onClick={() => setOpen({ mode: "update", row })} />
                <IconButton label="Delete" icon="trash" onClick={() => setOpen({ mode: "delete", row })} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      {open?.mode === "create" ? (
        <CouponForm
          title="Add coupon"
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onFailed={setError}
        />
      ) : null}
      {open?.mode === "update" && open.row ? (
        <CouponForm
          title="Update coupon"
          row={open.row}
          onClose={() => setOpen(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            refresh();
          }}
          onFailed={setError}
        />
      ) : null}
      {open?.mode === "detail" && open.row ? <CouponDetail row={open.row} onClose={() => setOpen(null)} /> : null}
      {open?.mode === "delete" && open.row ? (
        <CouponDelete
          row={open.row}
          onClose={() => setOpen(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setOpen(null);
            if (offset > 0 && rows.length === 1) setOffset(Math.max(0, offset - limit));
            else refresh();
          }}
          onFailed={(message) => {
            setError(message);
            setOpen(null);
          }}
        />
      ) : null}
    </section>
  );
}

function CouponForm({
  title,
  row,
  onClose,
  onSaved,
  onFailed,
}: {
  title: string;
  row?: CouponRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<CouponWrite>({
    code: row?.code ?? "",
    discount_type: row?.discount_type ?? "percent",
    discount_value: row?.discount_value ?? 10,
    max_discount_inr: row?.max_discount_inr ?? null,
    min_order_inr: row?.min_order_inr ?? null,
    starts_on: dateInput(row?.starts_on),
    ends_on: dateInput(row?.ends_on),
    usage_limit: row?.usage_limit ?? null,
    per_user_limit: row?.per_user_limit ?? null,
    is_active: row?.is_active ?? true,
    note: row?.note ?? "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const body = {
        ...form,
        code: form.code.trim().toUpperCase(),
        note: form.note?.trim() || null,
        starts_on: form.starts_on || null,
        ends_on: form.ends_on || null,
        max_discount_inr: form.max_discount_inr || null,
        min_order_inr: form.min_order_inr ?? null,
        usage_limit: form.usage_limit || null,
        per_user_limit: form.per_user_limit || null,
      };
      const result = row ? await couponService.update({ ...body, id: row.id }) : await couponService.create(body);
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not save the coupon.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={title} onClose={onClose} size="lg">
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <TextField required fullWidth label="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
          <TextField select fullWidth label="Type" value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value as "percent" | "fixed" })}>
            <MenuItem value="percent">Percent</MenuItem>
            <MenuItem value="fixed">Fixed ₹</MenuItem>
          </TextField>
          <TextField required fullWidth type="number" label="Value" value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: Number(event.target.value) })} />
          <TextField fullWidth type="number" label="Max discount ₹" value={form.max_discount_inr ?? ""} onChange={(event) => setForm({ ...form, max_discount_inr: event.target.value ? Number(event.target.value) : null })} />
          <TextField fullWidth type="number" label="Min order ₹" value={form.min_order_inr ?? ""} onChange={(event) => setForm({ ...form, min_order_inr: event.target.value ? Number(event.target.value) : null })} />
          <TextField select fullWidth label="Status" value={form.is_active ? "active" : "inactive"} onChange={(event) => setForm({ ...form, is_active: event.target.value === "active" })}>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <TextField fullWidth type="date" label="Starts on" slotProps={{ inputLabel: { shrink: true } }} value={form.starts_on ?? ""} onChange={(event) => setForm({ ...form, starts_on: event.target.value || null })} />
          <TextField fullWidth type="date" label="Ends on" slotProps={{ inputLabel: { shrink: true } }} value={form.ends_on ?? ""} onChange={(event) => setForm({ ...form, ends_on: event.target.value || null })} />
          <TextField fullWidth type="number" label="Usage limit" value={form.usage_limit ?? ""} onChange={(event) => setForm({ ...form, usage_limit: event.target.value ? Number(event.target.value) : null })} />
          <TextField fullWidth type="number" label="Per user limit" value={form.per_user_limit ?? ""} onChange={(event) => setForm({ ...form, per_user_limit: event.target.value ? Number(event.target.value) : null })} />
          <TextField className="sm:col-span-2" fullWidth label="Note" value={form.note ?? ""} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          <button type="submit" disabled={pending} className="sm:col-span-2 mt-1 w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function CouponDetail({ row, onClose }: { row: CouponRow; onClose: () => void }) {
  return (
    <Dialog title="Coupon detail" onClose={onClose}>
      <DetailList
        rows={[
          ["Code", row.code],
          ["Discount", discountLabel(row)],
          ["Max discount", row.max_discount_inr != null ? `₹${row.max_discount_inr}` : "—"],
          ["Min order", row.min_order_inr != null ? `₹${row.min_order_inr}` : "—"],
          ["Validity", validityLabel(row)],
          ["Uses", `${row.used_count}${row.usage_limit != null ? ` / ${row.usage_limit}` : ""}`],
          ["Per user", row.per_user_limit != null ? String(row.per_user_limit) : "—"],
          ["Status", row.is_active ? "Active" : "Inactive"],
          ["Note", row.note || "—"],
          ["Created by", row.creator?.name || "—"],
        ]}
        valueClassName="text-right font-medium text-stone-900"
      />
    </Dialog>
  );
}

function CouponDelete({
  row,
  onClose,
  onDeleted,
  onFailed,
}: {
  row: CouponRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await couponService.remove(row.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the coupon.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete coupon" onClose={onClose}>
      <p className="text-sm text-stone-600">Delete {row.code}? Used coupons cannot be deleted.</p>
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

function discountLabel(row: CouponRow) {
  return row.discount_type === "percent" ? `${row.discount_value}%` : `₹${row.discount_value}`;
}

function validityLabel(row: CouponRow) {
  if (!row.starts_on && !row.ends_on) return "Always";
  return `${shortDate(row.starts_on) || "…"} → ${shortDate(row.ends_on) || "…"}`;
}

function dateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function shortDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
