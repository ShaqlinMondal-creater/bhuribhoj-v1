"use client";

import { useEffect, useMemo, useState } from "react";
import { rowClass, TableShell, TableStatus, thClass } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { FilterBar, FilterDate, FilterSearch, FilterSelect } from "@/components/ui/FilterBar";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { kolkataDateTime } from "@/lib/format";
import { logService, type LogRow } from "@/services/logService";

const KNOWN_ACTIONS = [
  "config.delete",
  "config.save",
  "contact.reply",
  "contact.send",
  "contact.status",
  "coupon.create",
  "coupon.delete",
  "coupon.redeem",
  "coupon.update",
  "daily_meal.delete",
  "daily_meal.save",
  "deposit.create",
  "deposit.delete",
  "deposit.update",
  "expense.create",
  "expense.delete",
  "expense.update",
  "guest_meal.create",
  "guest_meal.delete",
  "guest_meal.update",
  "meal_away.delete",
  "meal_away.save",
  "meal_away.update",
  "member.create",
  "member.update",
  "menu.delete",
  "menu.save",
  "mess.assign",
  "mess.create",
  "mess.delete",
  "mess.theme",
  "mess.update",
  "mess_meal.update",
  "payment.delete",
  "plan.create",
  "plan.delete",
  "plan.update",
  "settings.save",
  "subscription.delete",
  "user.delete",
  "user.update",
] as const;

export function LogsScreen() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [count, setCount] = useState(0);
  const [actionsFromApi, setActionsFromApi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<LogRow | null>(null);
  const from = isDmy(fromDate) ? isoFromDmy(fromDate) : "";
  const to = isDmy(toDate) ? isoFromDmy(toDate) : "";

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
    logService
      .fetch({
        search: search || undefined,
        action: action || undefined,
        from_date: from || undefined,
        to_date: to || undefined,
        limit,
        offset,
      })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data ?? []);
        setCount(result.count ?? result.data?.length ?? 0);
        if (Array.isArray(result.actions)) setActionsFromApi(result.actions);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load logs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, action, from, to, limit, offset]);

  const actionOptions = useMemo(() => {
    const merged = new Set<string>([...KNOWN_ACTIONS, ...actionsFromApi]);
    if (action) merged.add(action);
    return [
      { value: "", label: "All" },
      ...Array.from(merged)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ];
  }, [actionsFromApi, action]);

  const filtered = search !== "" || action !== "" || from !== "" || to !== "";

  return (
    <section className="space-y-5">
      <PageHeader eyebrow="Action" title="Logs" description="A record of what changed on the platform." />
      {error ? <Notice>{error}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} onChange={setSearchInput} placeholder="Message, actor, or subject" />
        <FilterSelect
          label="Action"
          value={action}
          onChange={(value) => {
            setAction(value);
            setOffset(0);
          }}
          options={actionOptions}
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
            <th className={thClass()}>When</th>
            <th className={thClass()}>Action</th>
            <th className={thClass()}>Actor</th>
            <th className={thClass()}>Message</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={5}
          loading={loading && rows.length === 0}
          empty={!loading && rows.length === 0 ? (filtered ? "No logs match these filters." : "No logs yet.") : null}
        />
        {rows.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 text-stone-600">{row.created_at ? kolkataDateTime(row.created_at) : "—"}</td>
            <td className="px-4 py-3 font-medium text-stone-950">{row.action}</td>
            <td className="px-4 py-3 text-stone-700">{row.actor?.name || "System"}</td>
            <td className="max-w-[20rem] truncate px-4 py-3 text-stone-700">{row.message}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end">
                <IconButton label="Detail" icon="eye" onClick={() => setDetail(row)} />
              </div>
            </td>
          </tr>
        ))}
      </TableShell>
      {detail ? <LogDetail row={detail} onClose={() => setDetail(null)} /> : null}
    </section>
  );
}

function LogDetail({ row, onClose }: { row: LogRow; onClose: () => void }) {
  return (
    <Dialog title="Log detail" onClose={onClose}>
      <DetailList
        rows={[
          ["When", row.created_at ? kolkataDateTime(row.created_at) : "—"],
          ["Action", row.action],
          ["Actor", row.actor?.name || "System"],
          ["Email", row.actor?.email || "—"],
          ["Mess", row.mess?.name || "—"],
          ["Subject", row.subject_type ? `${row.subject_type} #${row.subject_id ?? "—"}` : "—"],
          ["IP", row.ip || "—"],
          ["Message", row.message],
        ]}
        valueClassName="text-right font-medium text-stone-900"
      />
    </Dialog>
  );
}

function isDmy(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isoFromDmy(value: string) {
  const [day, month, year] = value.split("-");
  return `${year}-${month}-${day}`;
}
