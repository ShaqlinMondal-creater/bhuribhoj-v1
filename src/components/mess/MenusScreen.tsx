"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { rowClass, useClientPage } from "@/components/ui/DataTable";
import { DetailList } from "@/components/ui/DetailList";
import { Dialog } from "@/components/ui/Dialog";
import { Flash } from "@/components/ui/Flash";
import { FilterBar, FilterDate, FilterSearch, FilterSelect, MaterialScope } from "@/components/ui/FilterBar";
import { IconButton } from "@/components/ui/IconButton";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/icons/Icon";
import { downloadExcelCsv, downloadPdfTable } from "@/lib/exportTable";
import { longKolkataDate } from "@/lib/format";
import { notifyTodayMenuSaved } from "@/lib/todayMenuEvents";
import { mealInfo, mealOrder, type MealSlot } from "@/services/mealService";
import { menuService, type MenuRow } from "@/services/menuService";
import IconButtonMui from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

const mealCheckClass =
  "h-4 w-4 shrink-0 rounded border border-stone-300 bg-white text-emerald-800 accent-emerald-800 checked:border-emerald-800 [color-scheme:light]";

export function MenusScreen({ messId = null, hideHeader = false }: { messId?: number | null; hideHeader?: boolean } = {}) {
  const user = useMessUser();
  const canSave = user?.role === "president" || user?.role === "manager" || user?.role === "admin";
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
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);

  const from = isDmy(fromDate) ? fromDate : "";
  const to = isDmy(toDate) ? toDate : "";
  const dateOrderError = from && to && compareDmy(from, to) > 0 ? "The end date must be on or after the start date." : null;
  const filtered = search !== "" || meal !== "" || from !== "" || to !== "";
  const needsMess = user?.role === "admin";
  const ready = Boolean(user) && (!needsMess || Boolean(messId));

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!ready || !user) {
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
        meal_type: mealOrder.includes(meal as MealSlot) ? (meal as MealSlot) : undefined,
        from_date: from ? isoFromDmy(from) : undefined,
        to_date: to ? isoFromDmy(to) : undefined,
      }, messId)
      .then((page) => {
        if (cancelled) return;
        setRows(page.data ?? []);
        setSelected(new Set());
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
  }, [user, search, meal, from, to, dateOrderError, messId, ready, reloadKey]);

  const dayGroups = groupMenusByDay(rows);
  const table = useClientPage(dayGroups);
  const pageIds = useMemo(
    () => table.page.flatMap((day) => day.rows.map((row) => row.id)),
    [table.page],
  );
  const selectedOnPage = pageIds.filter((id) => selected.has(id));
  const allPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const somePageSelected = selectedOnPage.length > 0 && !allPageSelected;
  const selectedRows = useMemo(() => rows.filter((row) => selected.has(row.id)), [rows, selected]);

  function toggleOne(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      if (allPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }

  function exportSelected(kind: "excel" | "pdf") {
    if (selectedRows.length === 0) return;
    const headers = ["Date", "Meal", "Dishes", "Saved by"];
    const data = selectedRows.map((row) => [
      longKolkataDate(row.menu_date),
      mealInfo(row.meal_type).label,
      row.dishes,
      row.decider?.name || "",
    ]);
    try {
      if (kind === "excel") {
        downloadExcelCsv(`bhuribhoj-meals-${selectedRows.length}`, headers, data);
        setNotice(`Exported ${selectedRows.length} meal${selectedRows.length === 1 ? "" : "s"} to Excel.`);
      } else {
        downloadPdfTable("BhuriBhoj meals", headers, data);
        setNotice(`Opened PDF print view for ${selectedRows.length} meal${selectedRows.length === 1 ? "" : "s"}.`);
      }
      setError(null);
      setBulkOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export meals.");
      setNotice(null);
      setBulkOpen(false);
    }
  }

  useEffect(() => {
    if (!bulkOpen) return;
    function onPointer(event: MouseEvent) {
      if (!bulkMenuRef.current?.contains(event.target as Node)) setBulkOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setBulkOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [bulkOpen]);

  useEffect(() => {
    if (selected.size === 0) setBulkOpen(false);
  }, [selected.size]);

  if (!user) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;
  if (needsMess && !messId) {
    return <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500">Choose a mess to load menus.</p>;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {hideHeader ? <div /> : <PageHeader eyebrow="Mess Details" title="Meals" description="Menus grouped by day for this mess." />}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={bulkMenuRef}>
            <button
              type="button"
              disabled={selected.size === 0 || bulkPending}
              onClick={() => setBulkOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={bulkOpen}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Bulk actions{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            {bulkOpen && selected.size > 0 ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg shadow-stone-900/10"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={bulkPending}
                  onClick={() => exportSelected("excel")}
                  className="block w-full px-3.5 py-2 text-left text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={bulkPending}
                  onClick={() => exportSelected("pdf")}
                  className="block w-full px-3.5 py-2 text-left text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  Export PDF
                </button>
                {canSave ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={bulkPending}
                    onClick={() => {
                      setBulkOpen(false);
                      setBulkDelete(true);
                    }}
                    className="block w-full px-3.5 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete selected
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  disabled={bulkPending}
                  onClick={() => {
                    setSelected(new Set());
                    setBulkOpen(false);
                  }}
                  className="block w-full px-3.5 py-2 text-left text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                >
                  Clear selection
                </button>
              </div>
            ) : null}
          </div>
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
            ...mealOrder.map((slot) => ({ value: slot, label: mealInfo(slot).label })),
          ]}
        />
        <FilterDate label="From" value={fromDate} onChange={(value) => { setFromDate(value); table.setOffset(0); }} />
        <FilterDate label="To" value={toDate} onChange={(value) => { setToDate(value); table.setOffset(0); }} />
      </FilterBar>

      {loading && rows.length === 0 ? <div className="h-40 animate-pulse rounded-2xl bg-white" /> : null}
      {!loading && !error && dayGroups.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500">
          {filtered || dateOrderError ? "No meals match these filters." : "No meals yet."}
        </p>
      ) : null}

      {table.page.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5">
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={allPageSelected}
                ref={(el) => {
                  if (el) el.indeterminate = somePageSelected;
                }}
                onChange={togglePage}
                className={mealCheckClass}
              />
              Select page ({selectedOnPage.length}/{pageIds.length})
            </label>
            {selected.size > 0 ? (
              <p className="text-xs text-stone-500">{selected.size} selected across filters</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {table.page.map((day) => {
              const dayIds = day.rows.map((row) => row.id);
              const daySelected = dayIds.filter((id) => selected.has(id));
              const dayAll = dayIds.length > 0 && daySelected.length === dayIds.length;
              const daySome = daySelected.length > 0 && !dayAll;
              return (
                <section key={day.key} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
                  <div className="flex items-start gap-2 border-b border-stone-100 bg-stone-50 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={dayAll}
                      ref={(el) => {
                        if (el) el.indeterminate = daySome;
                      }}
                      onChange={() => {
                        setSelected((current) => {
                          const next = new Set(current);
                          if (dayAll) {
                            for (const id of dayIds) next.delete(id);
                          } else {
                            for (const id of dayIds) next.add(id);
                          }
                          return next;
                        });
                      }}
                      className={`mt-0.5 ${mealCheckClass}`}
                      aria-label={`Select all meals on ${longKolkataDate(day.key)}`}
                    />
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold leading-snug text-stone-950">{longKolkataDate(day.key)}</h2>
                      <p className="text-xs text-stone-500">
                        {day.rows.length} meal{day.rows.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <ul className="divide-y divide-stone-100">
                    {day.rows.map((row) => (
                      <li key={row.id} className={`px-3 py-2.5 ${rowClass}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleOne(row.id)}
                            className={`mt-0.5 ${mealCheckClass}`}
                            aria-label={`Select ${mealInfo(row.meal_type).label}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-stone-950">{mealInfo(row.meal_type).label}</p>
                              <div className="flex shrink-0">
                                <IconButton label="View detail" icon="eye" onClick={() => setViewing(row)} />
                                {canSave ? <IconButton label="Edit" icon="pencil" onClick={() => setEditing(row)} /> : null}
                                {canSave ? <IconButton label="Delete" icon="trash" onClick={() => setRemoving(row)} /> : null}
                              </div>
                            </div>
                            <p className="mt-0.5 line-clamp-3 text-sm text-stone-600">{row.dishes}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          <DayPager
            count={table.count}
            limit={table.limit}
            offset={table.offset}
            onLimit={table.setLimit}
            onOffset={table.setOffset}
          />
        </div>
      ) : null}
      {adding ? (
        <MenuForm
          title="Add menu"
          messId={messId}
          onClose={() => setAdding(false)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setAdding(false);
            setReloadKey((value) => value + 1);
            notifyTodayMenuSaved();
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
          messId={messId}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setEditing(null);
            setReloadKey((value) => value + 1);
            notifyTodayMenuSaved();
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
          messId={messId}
          onClose={() => setRemoving(null)}
          onDeleted={(message) => {
            setNotice(message);
            setError(null);
            setRemoving(null);
            setReloadKey((value) => value + 1);
            notifyTodayMenuSaved();
          }}
          onFailed={(message) => {
            setError(message);
            setNotice(null);
            setRemoving(null);
          }}
        />
      ) : null}
      {bulkDelete && user ? (
        <BulkDeleteMenusDialog
          rows={selectedRows}
          messId={messId}
          role={user.role}
          pending={bulkPending}
          setPending={setBulkPending}
          onClose={() => setBulkDelete(false)}
          onDeleted={(message) => {
            setBulkDelete(false);
            setSelected(new Set());
            setNotice(message);
            setError(null);
            setReloadKey((value) => value + 1);
            notifyTodayMenuSaved();
          }}
          onFailed={(message) => {
            setBulkDelete(false);
            setError(message);
            setNotice(null);
          }}
        />
      ) : null}
    </section>
  );
}

function MenuForm({
  title,
  row,
  messId = null,
  onClose,
  onSaved,
  onFailed,
}: {
  title: string;
  row?: MenuRow;
  messId?: number | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const user = useMessUser();
  const picker = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(row ? dmyFromMenu(row.menu_date) : todayDmy());
  const [meal, setMeal] = useState<MealSlot>(row?.meal_type ?? "lunch");
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
      }, messId);
      const moved = row && (dmyFromMenu(row.menu_date) !== date || row.meal_type !== meal);
      if (moved) await menuService.remove(user.role, row.id, messId);
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
          <TextField select fullWidth label="Meal" value={meal} onChange={(event) => setMeal(event.target.value as MealSlot)}>
            {mealOrder.map((slot) => (
              <MenuItem key={slot} value={slot}>{mealInfo(slot).label}</MenuItem>
            ))}
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
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
    ["Meal", mealInfo(row.meal_type).label],
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
  messId = null,
  onClose,
  onDeleted,
  onFailed,
}: {
  row: MenuRow;
  messId?: number | null;
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
      const result = await menuService.remove(user.role, row.id, messId);
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
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
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

function BulkDeleteMenusDialog({
  rows,
  messId = null,
  role,
  pending,
  setPending,
  onClose,
  onDeleted,
  onFailed,
}: {
  rows: MenuRow[];
  messId?: number | null;
  role: "admin" | "president" | "manager" | "member";
  pending: boolean;
  setPending: (value: boolean) => void;
  onClose: () => void;
  onDeleted: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  async function onDelete() {
    setPending(true);
    try {
      for (const row of rows) {
        await menuService.remove(role, row.id, messId);
      }
      onDeleted(`Deleted ${rows.length} meal${rows.length === 1 ? "" : "s"}.`);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the selected meals.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Delete selected meals" onClose={onClose}>
      <p className="text-sm text-stone-600">
        Delete {rows.length} selected meal{rows.length === 1 ? "" : "s"}? This cannot be undone.
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" onClick={onClose} disabled={pending} className="flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-60">
          Cancel
        </button>
        <button type="button" onClick={() => void onDelete()} disabled={pending} className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)] disabled:opacity-60">
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Dialog>
  );
}

type DayGroup = { key: string; rows: MenuRow[] };

function groupMenusByDay(rows: MenuRow[]): DayGroup[] {
  const map = new Map<string, MenuRow[]>();
  for (const row of rows) {
    const key = menuDayKey(row.menu_date);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([key, list]) => ({
      key,
      rows: [...list].sort((a, b) => mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type)),
    }));
}

function menuDayKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-");
    return `${year}-${month}-${day}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dmyFromMenu(value).split("-").reverse().join("-");
}

function DayPager({
  count,
  limit,
  offset,
  onLimit,
  onOffset,
}: {
  count: number;
  limit: number;
  offset: number;
  onLimit: (limit: number) => void;
  onOffset: (offset: number) => void;
}) {
  const start = count === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, count);
  return (
    <div className="flex flex-wrap items-center justify-end gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
      <label className="flex items-center gap-2">
        Days per page
        <select
          value={limit}
          aria-label="Days per page"
          onChange={(event) => onLimit(Number(event.target.value))}
          className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm text-stone-800"
        >
          {[5, 10, 25].map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <span>
        {start}–{end} of {count} day{count === 1 ? "" : "s"}
      </span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Previous page"
          disabled={offset === 0}
          onClick={() => onOffset(Math.max(0, offset - limit))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-stone-100 disabled:text-stone-300"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={offset + limit >= count}
          onClick={() => onOffset(offset + limit)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-stone-600 hover:bg-stone-100 disabled:text-stone-300"
        >
          ›
        </button>
      </div>
    </div>
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
