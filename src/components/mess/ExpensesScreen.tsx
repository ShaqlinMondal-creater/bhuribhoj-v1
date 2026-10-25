"use client";

import { useEffect, useRef, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { Icon } from "@/components/icons/Icon";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterDate, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { inr, longKolkataDate } from "@/lib/format";
import { expenseService, type ExpenseRow, type NewExpense } from "@/services/expenseService";
import { messService } from "@/services/messService";
import IconButtonMui from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

const expenseField = {
  "& .MuiInputBase-root": {
    height: 36,
    fontSize: "0.8125rem",
  },
  "& .MuiInputBase-input": {
    padding: "6px 10px",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.8125rem",
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    minHeight: "0 !important",
    paddingTop: "6px",
    paddingBottom: "6px",
  },
} as const;

const categories: Array<{ value: NewExpense["category"]; label: string }> = [
  { value: "market", label: "Market" },
  { value: "constant", label: "Constant" },
  { value: "feast", label: "Feast" },
  { value: "tour", label: "Tour" },
  { value: "other", label: "Other" },
];

export function ExpensesScreen() {
  const user = useMessUser();
  const canRecord = user?.role === "president" || user?.role === "manager";
  const house = useApi(() => messService.house(user?.role ?? "president"), canRecord);
  const bothFunds = house.data?.data?.fund_type === "mess_and_manager";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [fund, setFund] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);

  const from = isDmy(fromDate) ? fromDate : "";
  const to = isDmy(toDate) ? toDate : "";
  const dateOrderError = from && to && compareDmy(from, to) > 0 ? "The end date must be on or after the start date." : null;
  const filtered = search !== "" || category !== "" || fund !== "" || from !== "" || to !== "";

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (dateOrderError) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    expenseService
      .fetch(user.role, {
        search: search || undefined,
        category: category ? (category as NewExpense["category"]) : undefined,
        fund_type: fund === "mess_fund" || fund === "manager_fund" ? fund : undefined,
        from_date: from ? isoFromDmy(from) : undefined,
        to_date: to ? isoFromDmy(to) : undefined,
      })
      .then((page) => {
        if (cancelled) return;
        setRows(page.data ?? []);
        setTotal(page.total_amount ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load expenses.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, search, category, fund, from, to, dateOrderError, reloadKey]);

  const table = useClientPage(rows);

  if (!user) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          eyebrow="Money"
          title="Expenses"
          description={total != null ? `Recorded total ${inr(total)}` : "Market, constant, feast, and tour spending."}
        />
        {canRecord ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Add expense
          </button>
        ) : null}
      </div>
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      {dateOrderError ? <Notice>{dateOrderError}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} placeholder="Title or note" onChange={setSearchInput} />
        <FilterSelect
          label="Category"
          value={category}
          width="9rem"
          onChange={(value) => {
            setCategory(value);
            table.setOffset(0);
          }}
          options={[{ value: "", label: "All" }, ...categories]}
        />
        <FilterSelect
          label="Fund"
          value={fund}
          onChange={(value) => {
            setFund(value);
            table.setOffset(0);
          }}
          options={[
            { value: "", label: "All funds" },
            { value: "manager_fund", label: "Manager fund" },
            ...(bothFunds ? [{ value: "mess_fund", label: "Mess fund" }] : []),
          ]}
        />
        <FilterDate label="From" value={fromDate} onChange={(value) => { setFromDate(value); table.setOffset(0); }} />
        <FilterDate label="To" value={toDate} onChange={(value) => { setToDate(value); table.setOffset(0); }} />
      </FilterBar>
      <TableShell
        count={table.count}
        limit={table.limit}
        offset={table.offset}
        onLimit={table.setLimit}
        onOffset={table.setOffset}
        head={
          <tr>
            <th className={thClass()}>Title</th>
            <th className={thClass()}>Quantity</th>
            <th className={thClass()}>Category</th>
            <th className={thClass()}>Fund</th>
            <th className={thClass()}>Date</th>
            <th className={thClass("right")}>Amount</th>
            {canRecord ? <th className={thClass("right")}>Actions</th> : null}
          </tr>
        }
      >
        <TableStatus
          colSpan={canRecord ? 7 : 6}
          loading={loading && rows.length === 0}
          empty={!loading && !error && table.count === 0 ? (filtered || dateOrderError ? "No expenses match these filters." : "No expenses yet.") : null}
        />
        {table.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium text-stone-950">{row.title}</td>
            <td className="px-4 py-3 text-stone-600">{quantityText(row.quantity)}</td>
            <td className="px-4 py-3 text-stone-600">{categoryLabel(row.category)}</td>
            <td className="px-4 py-3 text-stone-600">{row.fund_type === "mess_fund" ? "Mess fund" : "Manager fund"}</td>
            <td className="px-4 py-3 text-stone-600">{longKolkataDate(row.spent_on)}</td>
            <td className="px-4 py-3 text-right font-semibold text-stone-900">{inr(Number(row.amount))}</td>
            {canRecord ? (
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <IconButton label={`Edit ${row.title}`} icon="pencil" onClick={() => setEditing(row)} />
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </TableShell>
      {adding && user ? (
        <ExpenseForm
          role={user.role}
          bothFunds={bothFunds}
          onClose={() => setAdding(false)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setAdding(false);
            setReloadKey((value) => value + 1);
          }}
          onProgress={(message) => {
            setNotice(message);
            setError(null);
            setReloadKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
          }}
        />
      ) : null}
      {editing && user ? (
        <ExpenseForm
          role={user.role}
          bothFunds={bothFunds}
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setEditing(null);
            setReloadKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ExpenseForm({
  role,
  bothFunds,
  row,
  onClose,
  onSaved,
  onFailed,
  onProgress,
}: {
  role: "president" | "manager" | "member" | "admin";
  bothFunds: boolean;
  row?: ExpenseRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
  onProgress?: (message: string) => void;
}) {
  const pickers = useRef(new Map<string, HTMLInputElement>());
  const [drafts, setDrafts] = useState<ExpenseDraft[]>(() => [row ? draftFromRow(row) : emptyDraft()]);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function patch(key: string, partial: Partial<ExpenseDraft>) {
    setDrafts((list) => list.map((item) => (item.key === key ? { ...item, ...partial } : item)));
  }

  function openPicker(key: string) {
    const input = pickers.current.get(key);
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bodies: NewExpense[] = [];
    for (let index = 0; index < drafts.length; index += 1) {
      const draft = drafts[index];
      const label = drafts.length > 1 ? `expense ${index + 1}` : "the expense";
      if (!draft.title.trim()) {
        setFormError(`Enter a title for ${label}.`);
        return;
      }
      const quantity = (draft.quantity ?? "").trim();
      if (!quantity) {
        setFormError(`Enter a quantity for ${label}.`);
        return;
      }
      if (!isDmy(draft.date)) {
        setFormError(`Use dd-mm-yyyy for ${label}.`);
        return;
      }
      const value = Number(draft.amount);
      if (!Number.isFinite(value) || value < 0) {
        setFormError(`Enter an amount for ${label}.`);
        return;
      }
      bodies.push({
        title: draft.title.trim(),
        quantity,
        amount: value,
        spent_on: isoFromDmy(draft.date),
        category: draft.category,
        fund_type: draft.fund,
        note: draft.note.trim() || undefined,
      });
    }

    setPending(true);
    setFormError(null);
    try {
      if (row) {
        const result = await expenseService.update(role, { ...bodies[0], id: row.id });
        onSaved(result.message);
        return;
      }
      for (let index = 0; index < bodies.length; index += 1) {
        try {
          await expenseService.create(role, bodies[index]);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Could not record the expense.";
          if (index > 0) {
            setDrafts((list) => list.slice(index));
            onProgress?.(index === 1 ? "1 expense recorded." : `${index} expenses recorded.`);
            setFormError(`Expense ${index + 1} was not saved. ${message}`);
            return;
          }
          setFormError(message);
          onFailed(message);
          return;
        }
      }
      onSaved(bodies.length === 1 ? "Expense recorded." : `${bodies.length} expenses recorded.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not record the expense.";
      setFormError(message);
      onFailed(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={row ? "Edit expense" : "Add expense"} onClose={onClose} size="xl" backdrop="stone">
      <MaterialScope>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
            {drafts.map((draft, index) => (
              <div key={draft.key} className="rounded-2xl border border-stone-200 p-3">
                {!row ? (
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-stone-800">{drafts.length > 1 ? `Expense ${index + 1}` : "Expense"}</p>
                    <div className="flex">
                      <IconButton
                        label={`Copy expense ${index + 1}`}
                        icon="copy"
                        onClick={() => {
                          const copy = copyDraft(draft);
                          setDrafts((list) => {
                            if (list.some((item) => item.key === copy.key)) return list;
                            const at = list.findIndex((item) => item.key === draft.key);
                            const next = [...list];
                            next.splice(Math.max(at, 0) + 1, 0, copy);
                            return next;
                          });
                        }}
                      />
                      {drafts.length > 1 ? (
                        <IconButton label={`Remove expense ${index + 1}`} icon="trash" onClick={() => setDrafts((list) => list.filter((item) => item.key !== draft.key))} />
                      ) : null}
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-2 lg:grid-cols-5">
                  <TextField sx={expenseField} fullWidth required label="Title" value={draft.title ?? ""} onChange={(event) => patch(draft.key, { title: event.target.value })} />
                  <TextField
                    sx={expenseField}
                    fullWidth
                    required
                    label="Quantity"
                    value={draft.quantity ?? ""}
                    placeholder="250gm"
                    onChange={(event) => patch(draft.key, { quantity: event.target.value })}
                  />
                  <TextField
                    sx={expenseField}
                    fullWidth
                    required
                    label="Amount"
                    type="number"
                    value={draft.amount ?? ""}
                    onChange={(event) => patch(draft.key, { amount: event.target.value })}
                    slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                  />
                  <TextField
                    sx={expenseField}
                    select
                    fullWidth
                    label="Category"
                    value={draft.category ?? "market"}
                    onChange={(event) => {
                      const category = event.target.value as NewExpense["category"];
                      patch(draft.key, {
                        category,
                        note: noteAfterCategory(draft.note ?? "", draft.category ?? "market", category),
                      });
                    }}
                  >
                    {categories.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    sx={expenseField}
                    select
                    fullWidth
                    label="Fund"
                    value={draft.fund ?? "manager_fund"}
                    onChange={(event) => patch(draft.key, { fund: event.target.value as NewExpense["fund_type"] })}
                  >
                    <MenuItem value="manager_fund">Manager fund</MenuItem>
                    {bothFunds ? <MenuItem value="mess_fund">Mess fund</MenuItem> : null}
                  </TextField>
                  <div>
                    <TextField
                      sx={expenseField}
                      fullWidth
                      required
                      label="Date"
                      value={draft.date ?? ""}
                      placeholder="dd-mm-yyyy"
                      onChange={(event) => patch(draft.key, { date: event.target.value })}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButtonMui size="small" aria-label="Choose date" onClick={() => openPicker(draft.key)}>
                                <Icon name="calendar" className="h-3.5 w-3.5" />
                              </IconButtonMui>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <input
                      ref={(node) => {
                        if (node) pickers.current.set(draft.key, node);
                        else pickers.current.delete(draft.key);
                      }}
                      type="date"
                      tabIndex={-1}
                      aria-hidden
                      value={isDmy(draft.date) ? isoFromDmy(draft.date) : ""}
                      onChange={(event) => patch(draft.key, { date: dmyFromIso(event.target.value) })}
                      className="sr-only"
                    />
                  </div>
                  <TextField sx={expenseField} className="lg:col-span-4" fullWidth label="Note" value={draft.note ?? ""} onChange={(event) => patch(draft.key, { note: event.target.value })} />
                </div>
              </div>
            ))}
          </div>
          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!row ? (
              <button
                type="button"
                onClick={() => {
                  const added = emptyDraft();
                  setDrafts((list) => (list.some((item) => item.key === added.key) ? list : [...list, added]));
                }}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-800"
              >
                Add one more
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
                {pending ? "Saving…" : row ? "Save" : drafts.length > 1 ? "Save expenses" : "Save expense"}
              </button>
            </div>
          </div>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

type ExpenseDraft = {
  key: string;
  title: string;
  quantity: string;
  amount: string;
  date: string;
  category: NewExpense["category"];
  fund: NewExpense["fund_type"];
  note: string;
};

function nextDraftKey() {
  return crypto.randomUUID();
}

function emptyDraft(): ExpenseDraft {
  return {
    key: nextDraftKey(),
    title: "",
    quantity: "",
    amount: "",
    date: todayDmy(),
    category: "market",
    fund: "manager_fund",
    note: noteFor("market"),
  };
}

function copyDraft(source: ExpenseDraft): ExpenseDraft {
  return { ...source, key: nextDraftKey() };
}

function draftFromRow(row: ExpenseRow): ExpenseDraft {
  return {
    key: nextDraftKey(),
    title: row.title,
    quantity: quantityText(row.quantity),
    amount: Number(row.amount).toFixed(2),
    date: dmyFromSpent(row.spent_on),
    category: isCategory(row.category) ? row.category : "market",
    fund: row.fund_type === "mess_fund" ? "mess_fund" : "manager_fund",
    note: row.note?.trim() ? row.note : noteFor(isCategory(row.category) ? row.category : "market"),
  };
}

function noteFor(category: NewExpense["category"]) {
  const label = categories.find((item) => item.value === category)?.label ?? "Expense";
  return `${label} expense`;
}

function noteAfterCategory(note: string, from: NewExpense["category"], to: NewExpense["category"]) {
  if (note.trim() === "" || note === noteFor(from)) return noteFor(to);
  return note;
}

function quantityText(value: string | number | null | undefined) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function isCategory(value: string | undefined): value is NewExpense["category"] {
  return value === "market" || value === "constant" || value === "feast" || value === "tour" || value === "other";
}

function dmyFromSpent(value: string) {
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayDmy();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("day")}-${read("month")}-${read("year")}`;
}

function categoryLabel(value: string) {
  return categories.find((item) => item.value === value)?.label ?? value;
}

function todayDmy() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("day")}-${read("month")}-${read("year")}`;
}

function dmyFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function isoFromDmy(value: string) {
  const [day, month, year] = value.split("-");
  return `${year}-${month}-${day}`;
}

function isDmy(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function compareDmy(left: string, right: string) {
  const [leftDay, leftMonth, leftYear] = left.split("-").map(Number);
  const [rightDay, rightMonth, rightYear] = right.split("-").map(Number);
  return leftYear - rightYear || leftMonth - rightMonth || leftDay - rightDay;
}
