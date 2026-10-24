"use client";

import { useEffect, useRef, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { FilterAutocomplete, FilterBar, FilterDate, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Flash } from "@/components/ui/Flash";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { isPresident } from "@/lib/auth/roles";
import { inr } from "@/lib/format";
import { depositService, type DepositRow, type DepositWrite } from "@/services/depositService";
import { memberService } from "@/services/memberService";
import { messService } from "@/services/messService";
import type { LaravelUser } from "@/types/auth";

const fundLabel: Record<string, string> = {
  mess_fund: "Mess fund",
  manager_fund: "Manager fund",
};
const typeLabel: Record<string, string> = {
  join: "Join",
  monthly: "Monthly",
  extra: "Extra",
};

type Draft = {
  user_id: string;
  fund_type: DepositWrite["fund_type"];
  deposit_type: DepositWrite["deposit_type"];
  amount: string;
  deposited_on: string;
  for_month: string;
  note: string;
};

export function DepositsScreen() {
  const user = useMessUser();
  const president = isPresident(user?.role);
  const house = useApi(() => messService.house("president"), president);
  const bothFunds = house.data?.data?.fund_type === "mess_and_manager";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fund, setFund] = useState("");
  const [kind, setKind] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [count, setCount] = useState(0);
  const [members, setMembers] = useState<LaravelUser[]>([]);
  const [loading, setLoading] = useState(president);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DepositRow | null>(null);
  const [viewing, setViewing] = useState<DepositRow | null>(null);
  const [removing, setRemoving] = useState<DepositRow | null>(null);

  const from = isDmy(fromDate) ? fromDate : "";
  const to = isDmy(toDate) ? toDate : "";
  const dateOrderError = from && to && compareDmy(from, to) > 0 ? "The end date must be on or after the start date." : null;
  const monthValue = monthChoices("").find((item) => item.label.toLowerCase() === month.trim().toLowerCase())?.value ?? "";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!president) {
      setLoading(false);
      return;
    }
    if (dateOrderError) {
      setRows([]);
      setCount(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    depositService
      .fetch("president", {
        search: search || undefined,
        fund_type: fund || undefined,
        deposit_type: kind || undefined,
        for_month: monthValue || undefined,
        from_date: from || undefined,
        to_date: to || undefined,
        limit,
        offset,
      })
      .then((page) => {
        if (cancelled) return;
        setRows(page.data ?? []);
        setCount(page.count ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load deposits.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [president, search, fund, kind, monthValue, from, to, dateOrderError, limit, offset, reloadKey]);

  useEffect(() => {
    if (!president) return;
    let cancelled = false;
    memberService
      .fetch("president", { limit: 100, offset: 0 })
      .then((page) => {
        if (!cancelled) setMembers(page.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [president, reloadKey]);

  if (!user) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;

  if (!president) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Mess Details" title="Deposites" description="Only the president records deposits." />
        <EmptyState icon="wallet" title="Restricted" description="Ask the president to record a deposit." />
      </section>
    );
  }

  const filtered = search !== "" || monthValue !== "" || from !== "" || to !== "" || fund !== "" || kind !== "";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow="Mess Details" title="Deposites" description="Money members have put into this mess." />
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Add deposit
        </button>
      </div>
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      {dateOrderError ? <Notice>{dateOrderError}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} placeholder="Name or member no" onChange={setSearchInput} />
        <FilterAutocomplete
          label="Month"
          value={month}
          options={monthChoices("").map((item) => item.label)}
          onChange={(value) => {
            setMonth(value);
            setOffset(0);
          }}
        />
        <FilterDate label="From" value={fromDate} onChange={(value) => { setFromDate(value); setOffset(0); }} />
        <FilterDate label="To" value={toDate} onChange={(value) => { setToDate(value); setOffset(0); }} />
        <FilterSelect
          label="Fund"
          value={fund}
          onChange={(value) => {
            setFund(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All funds" },
            { value: "manager_fund", label: "Manager fund" },
            ...(bothFunds ? [{ value: "mess_fund", label: "Mess fund" }] : []),
          ]}
        />
        <FilterSelect
          label="Type"
          value={kind}
          onChange={(value) => {
            setKind(value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "All types" },
            { value: "join", label: "Join" },
            { value: "monthly", label: "Monthly" },
            { value: "extra", label: "Extra" },
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
            <th className={thClass()}>Member</th>
            <th className={thClass()}>Fund</th>
            <th className={thClass()}>Type</th>
            <th className={thClass()}>Amount</th>
            <th className={thClass()}>Date</th>
            <th className={thClass()}>Month</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={7}
          loading={loading && rows.length === 0}
          empty={!loading && !error && rows.length === 0 ? (filtered || dateOrderError ? "No deposits match these filters." : "No deposits yet.") : null}
        />
        {rows.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3">
              <p className="font-medium text-stone-950">{row.user?.name ?? "Member"}</p>
              <p className="text-xs text-stone-500">{row.user?.member_code || row.user?.email || "—"}</p>
            </td>
            <td className="px-4 py-3 text-stone-700">{fundLabel[row.fund_type] ?? row.fund_type}</td>
            <td className="px-4 py-3 text-stone-700">{typeLabel[row.deposit_type] ?? row.deposit_type}</td>
            <td className="px-4 py-3 font-medium text-stone-950">{inr(Number(row.amount))}</td>
            <td className="px-4 py-3 text-stone-600">{row.deposited_on || "—"}</td>
            <td className="px-4 py-3 text-stone-600">{monthLabel(row.for_month) || "—"}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <IconButton label="View detail" icon="eye" onClick={() => setViewing(row)} />
                <IconButton label="Edit" icon="pencil" onClick={() => setEditing(row)} />
                <IconButton label="Delete" icon="trash" onClick={() => setRemoving(row)} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>
      {adding ? (
        <DepositForm
          title="Add deposit"
          members={members}
          bothFunds={bothFunds}
          monthlyDue={house.data?.data?.monthly_due_amount ?? null}
          startingDeposit={house.data?.data?.s_deposite_amount ?? null}
          onClose={() => setAdding(false)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setAdding(false);
            setReloadKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
          }}
        />
      ) : null}
      {editing ? (
        <DepositForm
          title="Edit deposit"
          row={editing}
          members={members}
          bothFunds={bothFunds || editing.fund_type === "mess_fund"}
          monthlyDue={house.data?.data?.monthly_due_amount ?? null}
          startingDeposit={house.data?.data?.s_deposite_amount ?? null}
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
      {viewing ? <DetailDialog row={viewing} onClose={() => setViewing(null)} /> : null}
      {removing ? (
        <DeleteDialog
          row={removing}
          onClose={() => setRemoving(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setRemoving(null);
            if (offset > 0 && rows.length === 1) setOffset(Math.max(0, offset - limit));
            else setReloadKey((value) => value + 1);
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
            setRemoving(null);
          }}
        />
      ) : null}
    </section>
  );
}

function DepositForm({
  title,
  row,
  members,
  bothFunds,
  monthlyDue,
  startingDeposit,
  onClose,
  onSaved,
  onFailed,
}: {
  title: string;
  row?: DepositRow;
  members: LaravelUser[];
  bothFunds: boolean;
  monthlyDue: string | number | null;
  startingDeposit: string | number | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const openedAsEdit = useRef(Boolean(row));
  const [draft, setDraft] = useState<Draft>({
    user_id: row ? String(row.user_id) : "",
    fund_type: row?.fund_type === "mess_fund" ? "mess_fund" : "manager_fund",
    deposit_type: (row?.deposit_type as Draft["deposit_type"]) || "monthly",
    amount: row ? String(row.amount) : "",
    deposited_on: row?.deposited_on || todayDmy(),
    for_month: row?.for_month ? monthValueFrom(row.for_month) : currentMonthValue(),
    note: row?.note || "",
  });
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [history, setHistory] = useState<DepositRow[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const amountTouched = useRef(Boolean(row));
  const noteTouched = useRef(Boolean(row?.note));

  useEffect(() => {
    const month = currentMonthValue();
    const editing = openedAsEdit.current;
    if (editing) openedAsEdit.current = false;

    if (!editing && draft.fund_type === "mess_fund") {
      setDraft((current) => ({
        ...current,
        deposit_type: "join",
        for_month: "",
      }));
    }

    if (!draft.user_id) {
      setHistory([]);
      setHistoryReady(false);
      if (!editing && draft.fund_type !== "mess_fund") {
        setDraft((current) => ({
          ...current,
          deposit_type: "monthly",
          for_month: month,
        }));
      }
      return;
    }

    let cancelled = false;
    setChecking(true);
    setHistoryReady(false);
    depositService
      .fetch("president", {
        user_id: Number(draft.user_id),
        fund_type: draft.fund_type,
        limit: 100,
        offset: 0,
      })
      .then((page) => {
        if (cancelled) return;
        const rows = (page.data ?? []).filter((item) => item.id !== row?.id);
        setHistory(rows);
        setHistoryReady(true);
        if (editing || draft.fund_type === "mess_fund") return;
        const already = rows.some((item) => sameMonth(item.for_month || item.deposited_on, month));
        setDraft((current) => ({
          ...current,
          deposit_type: already ? "extra" : "monthly",
          for_month: month,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setHistory([]);
        setHistoryReady(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.user_id, draft.fund_type, monthlyDue, startingDeposit, openedAsEdit, row]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{2}-\d{2}-\d{4}$/.test(draft.deposited_on)) {
      setFormError("Use dd-mm-yyyy for the date.");
      return;
    }
    if (draft.fund_type !== "mess_fund" && !monthValueFrom(draft.for_month)) {
      setFormError("Choose a month.");
      return;
    }
    const amount = Number(draft.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      setFormError("Amount must be at least 1.");
      return;
    }
    if (!draft.user_id) {
      setFormError("Choose a member.");
      return;
    }
    const body: DepositWrite = {
      user_id: Number(draft.user_id),
      fund_type: draft.fund_type,
      deposit_type: draft.deposit_type,
      amount,
      deposited_on: draft.deposited_on,
      for_month: draft.fund_type === "mess_fund" ? null : monthValueFrom(draft.for_month),
      note: draft.note.trim() || null,
    };
    setPending(true);
    setFormError(null);
    try {
      const result = row
        ? await depositService.update("president", { ...body, id: row.id })
        : await depositService.create("president", body);
      onSaved(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save the deposit.";
      setFormError(message);
      onFailed(message);
    } finally {
      setPending(false);
    }
  }

  const chosen = members.find((member) => String(member.id) === draft.user_id) ?? null;
  const dueValue = draft.fund_type === "mess_fund" ? startingDeposit : monthlyDue;
  const selectedMonth = draft.fund_type === "mess_fund" ? "" : monthValueFrom(draft.for_month) || currentMonthValue();
  const shownDeposits = history
    .filter((item) => draft.fund_type === "mess_fund" || sameMonth(item.for_month || item.deposited_on, selectedMonth))
    .sort((left, right) => dateKey(right.deposited_on) - dateKey(left.deposited_on));
  const depositedTotal = shownDeposits.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remaining = dueValue !== null && dueValue !== "" ? Number(dueValue) - depositedTotal : null;
  const dueText = remaining !== null && Number.isFinite(remaining) ? inr(remaining) : "—";
  const months = monthChoices(draft.for_month);

  useEffect(() => {
    amountTouched.current = Boolean(row);
    noteTouched.current = Boolean(row?.note);
  }, [draft.user_id, draft.fund_type, row]);

  useEffect(() => {
    if (row || checking || !historyReady || !draft.user_id) return;
    if (remaining === null || !Number.isFinite(remaining)) return;
    const nextAmount = remaining >= 1 ? remaining.toFixed(2) : "";
    const nextNote = noteFor(draft.deposit_type);
    setDraft((current) => {
      const amount = amountTouched.current ? current.amount : nextAmount || current.amount;
      const note = noteTouched.current ? current.note : nextNote;
      if (amount === current.amount && note === current.note) return current;
      return { ...current, amount, note };
    });
  }, [checking, draft.user_id, draft.deposit_type, draft.fund_type, historyReady, remaining, row]);

  return (
    <Dialog title={title} onClose={onClose} size="lg" backdrop="stone">
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Autocomplete
            className="sm:col-span-2"
            options={members}
            value={chosen}
            onChange={(_, member) => setDraft({ ...draft, user_id: member ? String(member.id) : "" })}
            getOptionLabel={(member) => (member.member_code ? `${member.name} · ${member.member_code}` : member.name)}
            isOptionEqualToValue={(left, right) => String(left.id) === String(right.id)}
            renderInput={(params) => <TextField {...params} label="Member" required />}
          />
          <TextField
            select
            fullWidth
            label="Fund"
            value={draft.fund_type}
            onChange={(event) => setDraft({ ...draft, fund_type: event.target.value as Draft["fund_type"] })}
          >
            <MenuItem value="manager_fund">Manager fund</MenuItem>
            {bothFunds ? <MenuItem value="mess_fund">Mess fund</MenuItem> : null}
          </TextField>
          <TextField
            select
            fullWidth
            label="Type"
            value={draft.deposit_type}
            disabled={draft.fund_type === "mess_fund" || checking}
            onChange={(event) => {
              const depositType = event.target.value as Draft["deposit_type"];
              setDraft({
                ...draft,
                deposit_type: depositType,
                note: noteTouched.current ? draft.note : noteFor(depositType),
              });
            }}
          >
            {draft.fund_type === "mess_fund" || draft.deposit_type === "join" ? <MenuItem value="join">Join</MenuItem> : null}
            {draft.fund_type === "manager_fund" ? <MenuItem value="monthly">Monthly</MenuItem> : null}
            {draft.fund_type === "manager_fund" ? <MenuItem value="extra">Extra</MenuItem> : null}
          </TextField>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            required
            value={draft.amount}
            onChange={(event) => {
              amountTouched.current = true;
              setDraft({ ...draft, amount: event.target.value });
            }}
            slotProps={{ htmlInput: { min: 1, step: "0.01" } }}
          />
          <TextField
            fullWidth
            label="Date"
            required
            value={draft.deposited_on}
            placeholder="dd-mm-yyyy"
            onChange={(event) => setDraft({ ...draft, deposited_on: event.target.value })}
          />
          {draft.fund_type === "manager_fund" ? (
            <TextField
              select
              fullWidth
              label="Month"
              value={monthValueFrom(draft.for_month) || currentMonthValue()}
              onChange={(event) => {
                amountTouched.current = false;
                setDraft({ ...draft, for_month: event.target.value });
              }}
            >
              {months.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField
            className="sm:col-span-2"
            fullWidth
            label="Note"
            value={draft.note}
            onChange={(event) => {
              noteTouched.current = true;
              setDraft({ ...draft, note: event.target.value });
            }}
          />
          {chosen ? (
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 sm:items-start">
              <div>
                <p className="text-sm text-stone-600">
                  Due amount <span className={depositedTotal > 0 ? "font-semibold text-red-600" : "font-semibold text-stone-900"}>{dueText}</span>
                </p>
                <p className="text-xs text-stone-400">{draft.fund_type === "mess_fund" ? "Starting deposit" : "Monthly due"}</p>
              </div>
              {shownDeposits.length > 0 ? (
                <ul className="space-y-1 text-sm font-medium text-green-700">
                  {shownDeposits.map((item) => (
                    <li key={item.id}>
                      Date: {item.deposited_on}, Amount: {moneyAmount(item.amount)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {formError ? <p className="text-sm text-red-700 sm:col-span-2">{formError}</p> : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
              {pending ? "Saving…" : row ? "Save" : "Add deposit"}
            </button>
          </div>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function DetailDialog({ row, onClose }: { row: DepositRow; onClose: () => void }) {
  const added = addedName(row.added_by);
  const lines: Array<[string, string]> = [
    ["Member", row.user?.name ?? "—"],
    ["Code", row.user?.member_code || "—"],
    ["Fund", fundLabel[row.fund_type] ?? row.fund_type],
    ["Type", typeLabel[row.deposit_type] ?? row.deposit_type],
    ["Amount", inr(Number(row.amount))],
    ["Date", row.deposited_on || "—"],
    ["Month", monthLabel(row.for_month) || "—"],
    ["Note", row.note || "—"],
    ["Added by", added],
  ];
  return (
    <Dialog title="Deposit detail" onClose={onClose}>
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
  row: DepositRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onDelete() {
    setPending(true);
    try {
      const result = await depositService.remove("president", row.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the deposit.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete deposit" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete the {inr(Number(row.amount))} {typeLabel[row.deposit_type] ?? "deposit"} for {row.user?.name ?? "this member"}?
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
  const [leftDay, leftMonth, leftYear] = left.split("-").map(Number);
  const [rightDay, rightMonth, rightYear] = right.split("-").map(Number);
  return leftYear - rightYear || leftMonth - rightMonth || leftDay - rightDay;
}

function addedName(value: DepositRow["added_by"]) {
  if (value && typeof value === "object") return value.name;
  return "—";
}

function currentMonthValue() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  return `01-${month}-${year}`;
}

function monthValueFrom(value: string | null | undefined) {
  const match = String(value ?? "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return "";
  return `01-${match[2]}-${match[3]}`;
}

function monthLabel(value: string | null | undefined) {
  const normalized = monthValueFrom(value);
  if (!normalized) return "";
  const [, month, year] = normalized.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function monthChoices(selected: string) {
  const current = currentMonthValue();
  const [, monthText, yearText] = current.split("-");
  const month = Number(monthText);
  const year = Number(yearText);
  const items: Array<{ value: string; label: string }> = [];
  for (let index = 11; index >= 0; index -= 1) {
    const cursor = new Date(Date.UTC(year, month - 1 - index, 1));
    const value = `01-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${cursor.getUTCFullYear()}`;
    items.push({ value, label: monthLabel(value) });
  }
  const extra = monthValueFrom(selected);
  if (extra && !items.some((item) => item.value === extra)) {
    items.unshift({ value: extra, label: monthLabel(extra) });
  }
  return items;
}

function sameMonth(left: string | null | undefined, right: string) {
  const first = monthValueFrom(left);
  const second = monthValueFrom(right);
  return Boolean(first && second && first === second);
}

function noteFor(type: Draft["deposit_type"]) {
  if (type === "join") return "Join deposit";
  if (type === "extra") return "Extra deposit";
  return "Monthly due";
}

function moneyAmount(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

function dateKey(value: string) {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return 0;
  return Number(match[3]) * 10000 + Number(match[2]) * 100 + Number(match[1]);
}

function todayDmy() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  return parts.replaceAll("/", "-");
}
