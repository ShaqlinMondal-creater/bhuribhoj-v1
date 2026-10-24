"use client";

import { useEffect, useRef, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterDate, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/icons/Icon";
import { longKolkataDate } from "@/lib/format";
import { menuService, type MenuRow } from "@/services/menuService";
import IconButtonMui from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

type MealType = "lunch" | "dinner";

export function MenusScreen() {
  const user = useMessUser();
  const canSave = user?.role === "president" || user?.role === "manager";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [meal, setMeal] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [viewing, setViewing] = useState<MenuRow | null>(null);
  const [removing, setRemoving] = useState<MenuRow | null>(null);

  const from = isDmy(fromDate) ? fromDate : "";
  const to = isDmy(toDate) ? toDate : "";
  const dateOrderError = from && to && compareDmy(from, to) > 0 ? "The end date must be on or after the start date." : null;
  const filtered = search !== "" || meal !== "" || from !== "" || to !== "";

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
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    menuService
      .fetch(user.role, {
        search: search || undefined,
        meal_type: meal === "lunch" || meal === "dinner" ? meal : undefined,
        from_date: from ? isoFromDmy(from) : undefined,
        to_date: to ? isoFromDmy(to) : undefined,
      })
      .then((page) => {
        if (cancelled) return;
        setRows(page.data ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load meals.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, search, meal, from, to, dateOrderError, reloadKey]);

  const table = useClientPage(rows);

  if (!user) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader eyebrow="Mess Details" title="Meals" description="Lunch and dinner menus for this mess." />
        {canSave ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Add menu
          </button>
        ) : null}
      </div>
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      {dateOrderError ? <Notice>{dateOrderError}</Notice> : null}
      <FilterBar>
        <FilterSearch value={searchInput} placeholder="Dishes" onChange={setSearchInput} />
        <FilterSelect
          label="Meal"
          value={meal}
          onChange={(value) => {
            setMeal(value);
            table.setOffset(0);
          }}
          options={[
            { value: "", label: "All meals" },
            { value: "lunch", label: "Lunch" },
            { value: "dinner", label: "Dinner" },
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
            <th className={thClass()}>Meal</th>
            <th className={thClass()}>Date</th>
            <th className={thClass()}>Dishes</th>
            <th className={thClass("right")}>Actions</th>
          </tr>
        }
      >
        <TableStatus
          colSpan={4}
          loading={loading && rows.length === 0}
          empty={!loading && !error && table.count === 0 ? (filtered || dateOrderError ? "No meals match these filters." : "No meals yet.") : null}
        />
        {table.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium capitalize text-stone-950">{row.meal_type}</td>
            <td className="px-4 py-3 text-stone-600">{longKolkataDate(row.menu_date)}</td>
            <td className="px-4 py-3 text-stone-700">{row.dishes}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end">
                <IconButton label="View detail" icon="eye" onClick={() => setViewing(row)} />
                {canSave ? <IconButton label="Edit" icon="pencil" onClick={() => setEditing(row)} /> : null}
                {canSave ? <IconButton label="Delete" icon="trash" onClick={() => setRemoving(row)} /> : null}
              </div>
            </td>
          </tr>
        ))}
      </TableShell>
      {adding ? (
        <MenuForm
          title="Add menu"
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
        <MenuForm
          title="Edit menu"
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
      {viewing ? <DetailDialog row={viewing} onClose={() => setViewing(null)} /> : null}
      {removing ? (
        <DeleteDialog
          row={removing}
          onClose={() => setRemoving(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setRemoving(null);
            setReloadKey((value) => value + 1);
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

function MenuForm({
  title,
  row,
  onClose,
  onSaved,
  onFailed,
}: {
  title: string;
  row?: MenuRow;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const user = useMessUser();
  const picker = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(row ? dmyFromMenu(row.menu_date) : todayDmy());
  const [meal, setMeal] = useState<MealType>(row?.meal_type ?? "lunch");
  const [dishes, setDishes] = useState(row?.dishes ?? "");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (!isDmy(date)) {
      setFormError("Use dd-mm-yyyy for the date.");
      return;
    }
    if (!dishes.trim()) {
      setFormError("Add the dishes.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const result = await menuService.save(user.role, {
        menu_date: isoFromDmy(date),
        meal_type: meal,
        dishes: dishes.trim(),
      });
      const moved = row && (dmyFromMenu(row.menu_date) !== date || row.meal_type !== meal);
      if (moved) await menuService.remove(user.role, row.id);
      onSaved(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save the menu.";
      setFormError(message);
      onFailed(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={title} onClose={onClose} size="lg" backdrop="stone">
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3">
          <TextField
            fullWidth
            required
            label="Date"
            value={date}
            placeholder="dd-mm-yyyy"
            onChange={(event) => setDate(event.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButtonMui
                      size="small"
                      aria-label="Choose date"
                      onClick={() => {
                        const input = picker.current;
                        if (!input) return;
                        if (typeof input.showPicker === "function") input.showPicker();
                        else input.click();
                      }}
                    >
                      <Icon name="calendar" className="h-4 w-4" />
                    </IconButtonMui>
                  </InputAdornment>
                ),
              },
            }}
          />
          <input
            ref={picker}
            type="date"
            tabIndex={-1}
            value={isDmy(date) ? isoFromDmy(date) : ""}
            onChange={(event) => setDate(dmyFromIso(event.target.value))}
            className="sr-only"
          />
          <TextField select fullWidth label="Meal" value={meal} onChange={(event) => setMeal(event.target.value as MealType)}>
            <MenuItem value="lunch">Lunch</MenuItem>
            <MenuItem value="dinner">Dinner</MenuItem>
          </TextField>
          <TextField
            fullWidth
            required
            label="Dishes"
            value={dishes}
            placeholder="Rice, dal, fish curry"
            onChange={(event) => setDishes(event.target.value)}
          />
          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
              {pending ? "Saving…" : row ? "Save" : "Save menu"}
            </button>
          </div>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function DetailDialog({ row, onClose }: { row: MenuRow; onClose: () => void }) {
  const lines: Array<[string, string]> = [
    ["Meal", row.meal_type === "dinner" ? "Dinner" : "Lunch"],
    ["Date", longKolkataDate(row.menu_date)],
    ["Dishes", row.dishes],
    ["Saved by", row.decider?.name || "—"],
  ];
  return (
    <Dialog title="Menu detail" onClose={onClose}>
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
  row: MenuRow;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const user = useMessUser();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!user) return;
    setPending(true);
    try {
      const result = await menuService.remove(user.role, row.id);
      onDeleted(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the menu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete menu" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete the {row.meal_type} menu for {longKolkataDate(row.menu_date)}?
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

function todayDmy() {
  return dmyFromMenu(new Date().toISOString());
}

function dmyFromMenu(value: string) {
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
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
