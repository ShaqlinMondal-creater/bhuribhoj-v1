"use client";

import { useState } from "react";
import { useMessUser, useSetMessSeat, useSetMessUser } from "@/components/auth/MessSession";
import { Icon } from "@/components/icons/Icon";
import { fieldClass as baseFieldClass, panelCard } from "@/components/ui/classes";
import { Flash } from "@/components/ui/Flash";
import { rowClass, TableShell, TableStatus, thClass, useClientPage } from "@/components/ui/DataTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import { isPresident } from "@/lib/auth/roles";
import type { FundType } from "@/lib/api/mess";
import type { Role } from "@/types/auth";
import { inr } from "@/lib/format";
import { authService } from "@/services/authService";
import { dashboardService } from "@/services/dashboardService";
import { mealService } from "@/services/mealService";
import { menuService } from "@/services/menuService";
import { messService, type GuestMealSetup, type House, type MessWrite } from "@/services/messService";

const fieldClass = `${baseFieldClass} disabled:bg-stone-50 disabled:text-stone-500`;

const tabs = [
  { id: "config", label: "Mess config", icon: "building" },
  { id: "meals", label: "Meal setup", icon: "meals" },
  { id: "reports", label: "Reports", icon: "grid" },
] as const;

const emptyHouse = {
  id: 0,
  name: "",
  code: "",
  address: "",
  district: "",
  pincode: "",
  contact_no: "",
  email: "",
  fund_type: "manager_only",
  is_active: false,
  monthly_due_amount: "",
  monthly_due_date: "",
  late_fee_amount: "",
  s_deposite_amount: "",
} as House;

export function HouseScreen() {
  const user = useMessUser();
  const president = isPresident(user?.role);
  const house = useApi(() => messService.house(user?.role ?? "president"), Boolean(user));
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("config");
  const current = house.data?.data ?? emptyHouse;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="House"
        title={current.name || "Mess house"}
        description="Mess config, guest meal prices, and the month's reports."
      />
      <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl bg-[var(--panel)] p-1.5" role="tablist">
        {tabs.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                selected
                  ? "bg-white/10 text-[var(--accent)]"
                  : "text-[var(--panel-muted)] hover:bg-white/10 hover:text-[var(--panel-ink)]"
              }`}
            >
              <Icon name={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
      {house.error ? <Notice>{house.error}</Notice> : null}
      {tab === "config" ? (
        house.loading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
        ) : (
          <MessConfig key={current.id || "new"} house={current} canEdit={president} onSaved={house.reload} />
        )
      ) : null}
      {tab === "meals" ? <MealSetup house={house.data?.data ?? null} canEdit={president && !!current.id} role={user?.role ?? "president"} /> : null}
      {tab === "reports" ? <AnalyticsReport role={user?.role ?? "president"} /> : null}
    </section>
  );
}

const fundLabel: Record<FundType, string> = {
  manager_only: "Manager fund only",
  mess_and_manager: "Mess fund and manager fund",
};

type ConfigKey = Exclude<keyof MessWrite, never>;

function MessConfig({
  house,
  canEdit,
  onSaved,
}: {
  house: House;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const setUser = useSetMessUser();
  const setSeat = useSetMessSeat();
  const [fundType, setFundType] = useState<FundType>(house.fund_type === "mess_and_manager" ? "mess_and_manager" : "manager_only");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const creating = !house.id;

  if (!creating) {
    return <MessProfile house={house} canEdit={canEdit} onSaved={onSaved} />;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    const data = new FormData(event.currentTarget);
    const fund = data.get("fund_type") === "mess_and_manager" ? "mess_and_manager" : "manager_only";
    const body = {
      name: String(data.get("name") ?? ""),
      address: String(data.get("address") ?? ""),
      district: String(data.get("district") ?? ""),
      pincode: String(data.get("pincode") ?? ""),
      contact_no: String(data.get("contact_no") ?? ""),
      email: optionalText(data.get("email")),
      fund_type: fund,
      monthly_due_amount: numberValue(data.get("monthly_due_amount")),
      monthly_due_date: optionalText(data.get("monthly_due_date")),
      late_fee_amount: numberValue(data.get("late_fee_amount")),
      s_deposite_amount: fund === "mess_and_manager" ? (optionalNumber(data.get("s_deposite_amount")) ?? null) : null,
    } as const;
    setPending(true);
    setError(null);
    setDone(null);
    try {
      if (creating) {
        const opened = await messService.open(body);
        const next = await authService.currentUser();
        setUser(next.user);
        setSeat(next.seat);
        setDone(opened.message);
      } else {
        const result = await messService.update(body);
        setDone(result.message);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the mess.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={panelCard}>
      <h2 className="text-sm font-semibold text-stone-900">Mess config</h2>
      <p className="mt-1 text-sm text-stone-500">Name, address, fund, and the monthly due. A manager can read this and cannot save it.</p>
      {error ? <div className="mt-4"><Notice>{error}</Notice></div> : null}
      {done ? <p className="mt-4 text-sm text-emerald-800">{done}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={house.name} disabled={!canEdit} required />
        <Field label="Code" name="code" defaultValue={house.code} disabled />
        <Field label="Address" name="address" defaultValue={house.address} disabled={!canEdit} required />
        <Field label="District" name="district" defaultValue={house.district} disabled={!canEdit} required />
        <Field label="Pincode" name="pincode" defaultValue={house.pincode} disabled={!canEdit} required />
        <Field label="Contact" name="contact_no" defaultValue={house.contact_no} disabled={!canEdit} required />
        <Field label="Email" name="email" type="email" defaultValue={house.email ?? ""} disabled={!canEdit} />
        <label className="block text-sm text-stone-600">
          Fund
          <select
            name="fund_type"
            className={fieldClass}
            value={fundType}
            disabled={!canEdit}
            onChange={(event) => setFundType(event.target.value === "mess_and_manager" ? "mess_and_manager" : "manager_only")}
          >
            <option value="manager_only">Manager fund only</option>
            <option value="mess_and_manager">Mess fund and manager fund</option>
          </select>
        </label>
        {fundType === "mess_and_manager" ? (
          <Field label="Starting deposit" name="s_deposite_amount" type="number" defaultValue={house.s_deposite_amount == null ? "" : String(house.s_deposite_amount)} disabled={!canEdit} />
        ) : null}
        <Field label="Monthly due amount" name="monthly_due_amount" type="number" defaultValue={house.monthly_due_amount === "" ? "" : String(house.monthly_due_amount)} disabled={!canEdit} />
        <Field label="Monthly due date" name="monthly_due_date" defaultValue={house.monthly_due_date ?? ""} disabled={!canEdit} placeholder="dd-mm-yyyy" />
        <Field label="Late fee" name="late_fee_amount" type="number" defaultValue={house.late_fee_amount === "" ? "" : String(house.late_fee_amount)} disabled={!canEdit} />
      </div>
      {canEdit ? (
        <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
          {pending ? "Saving…" : creating ? "Save mess" : "Save config"}
        </button>
      ) : null}
    </form>
  );
}

function MessProfile({
  house,
  canEdit,
  onSaved,
}: {
  house: House;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState<ConfigKey | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const bothFunds = house.fund_type === "mess_and_manager";

  function begin(key: ConfigKey, value: string) {
    setEditing(key);
    setDraft(value);
    setError(null);
  }

  function cancel() {
    setEditing(null);
    setDraft("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !canEdit || pending) return;
    const body = fieldBody(editing, draft);
    if (typeof body === "string") {
      setError(body);
      return;
    }
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await messService.update(body);
      setDone(result.message);
      setEditing(null);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the mess.");
    } finally {
      setPending(false);
    }
  }

  const houseRows: ProfileRow[] = [
    { key: "name", label: "Name", display: textOf(house.name), draft: house.name, kind: "text", required: true },
    { key: "code", label: "Code", display: textOf(house.code), draft: house.code, kind: "readonly" },
    { key: "email", label: "Email", display: textOf(house.email), draft: house.email ?? "", kind: "email" },
    { key: "contact_no", label: "Contact", display: textOf(house.contact_no), draft: house.contact_no, kind: "text", required: true },
  ];
  const addressRows: ProfileRow[] = [
    { key: "address", label: "Address", display: textOf(house.address), draft: house.address, kind: "text", required: true },
    { key: "district", label: "District", display: textOf(house.district), draft: house.district, kind: "text", required: true },
    { key: "pincode", label: "Pincode", display: textOf(house.pincode), draft: house.pincode, kind: "text", required: true },
  ];
  const dueRows: ProfileRow[] = [
    { key: "fund_type", label: "Fund", display: fundLabel[house.fund_type] ?? house.fund_type, draft: house.fund_type, kind: "select" },
    ...(bothFunds
      ? [{ key: "s_deposite_amount" as const, label: "Starting deposit", display: moneyOf(house.s_deposite_amount), draft: house.s_deposite_amount == null ? "" : String(house.s_deposite_amount), kind: "number" as const }]
      : []),
    { key: "monthly_due_amount", label: "Monthly due amount", display: moneyOf(house.monthly_due_amount), draft: house.monthly_due_amount === "" ? "" : String(house.monthly_due_amount), kind: "number" },
    { key: "monthly_due_date", label: "Monthly due date", display: textOf(house.monthly_due_date), draft: house.monthly_due_date ?? "", kind: "text" },
    { key: "late_fee_amount", label: "Late fee", display: moneyOf(house.late_fee_amount), draft: house.late_fee_amount === "" ? "" : String(house.late_fee_amount), kind: "number" },
  ];

  return (
    <div className="space-y-4">
      <Flash message={done} />
      {error ? <Notice>{error}</Notice> : null}
      {!canEdit ? <p className="text-sm text-stone-500">A manager can read this and cannot save it.</p> : null}
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <ProfileCard title="House" rows={houseRows} canEdit={canEdit} editing={editing} draft={draft} pending={pending} onBegin={begin} onDraft={setDraft} onCancel={cancel} onSave={save} />
        <ProfileCard title="Address" rows={addressRows} canEdit={canEdit} editing={editing} draft={draft} pending={pending} onBegin={begin} onDraft={setDraft} onCancel={cancel} onSave={save} />
        <div className="min-w-0 lg:col-span-2">
          <ProfileCard title="Dues" columns={2} rows={dueRows} canEdit={canEdit} editing={editing} draft={draft} pending={pending} onBegin={begin} onDraft={setDraft} onCancel={cancel} onSave={save} />
        </div>
      </div>
    </div>
  );
}

type ProfileRow = {
  key: ConfigKey | "code";
  label: string;
  display: string;
  draft: string;
  kind: "text" | "email" | "number" | "select" | "readonly";
  required?: boolean;
};

function ProfileCard({
  title,
  rows,
  columns = 1,
  canEdit,
  editing,
  draft,
  pending,
  onBegin,
  onDraft,
  onCancel,
  onSave,
}: {
  title: string;
  rows: ProfileRow[];
  columns?: 1 | 2;
  canEdit: boolean;
  editing: ConfigKey | null;
  draft: string;
  pending: boolean;
  onBegin: (key: ConfigKey, value: string) => void;
  onDraft: (value: string) => void;
  onCancel: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-stone-200 bg-white">
      <h2 className="px-3.5 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">{title}</h2>
      <div className={columns === 2 ? "grid lg:grid-cols-2 lg:gap-x-3" : undefined}>
        {rows.map((row, index) => {
          const open = row.kind !== "readonly" && editing === row.key;
          const cells = canEdit ? "grid-cols-[10.25rem_minmax(0,1fr)_auto]" : "grid-cols-[10.25rem_minmax(0,1fr)]";
          const endOfPair = columns === 2 && index + 2 >= rows.length;
          const rowClassName = `grid items-center gap-2 border-b border-stone-100 px-3.5 py-2 ${index === rows.length - 1 ? "border-b-0" : ""} ${endOfPair ? "lg:border-b-0" : ""} ${cells}`;
          if (!open) {
            return (
              <div key={row.key} className={rowClassName}>
                <p className="whitespace-nowrap text-sm text-stone-500">{row.label}</p>
                <p className="min-w-0 break-words text-sm font-medium text-stone-900">{row.display}</p>
                {canEdit ? (
                  row.kind === "readonly" ? (
                    <span className="w-7" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBegin(row.key as ConfigKey, row.draft)}
                      aria-label={`Edit ${row.label}`}
                      title={`Edit ${row.label}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Icon name="pencil" className="h-3.5 w-3.5" />
                    </button>
                  )
                ) : null}
              </div>
            );
          }
          return (
            <form key={row.key} onSubmit={onSave} className={rowClassName}>
              <label htmlFor={`mess-${row.key}`} className="whitespace-nowrap text-sm text-stone-500">
                {row.label}
              </label>
              {row.kind === "select" ? (
                <select
                  id={`mess-${row.key}`}
                  value={draft}
                  autoFocus
                  onChange={(event) => onDraft(event.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-900 outline-none focus:border-[var(--accent)]"
                >
                  <option value="manager_only">Manager fund only</option>
                  <option value="mess_and_manager">Mess fund and manager fund</option>
                </select>
              ) : (
                <input
                  id={`mess-${row.key}`}
                  value={draft}
                  autoFocus
                  type={row.kind === "number" ? "number" : row.kind === "email" ? "email" : "text"}
                  min={row.kind === "number" ? "0" : undefined}
                  step={row.kind === "number" ? "0.01" : undefined}
                  required={row.required}
                  placeholder={row.key === "monthly_due_date" ? "dd-mm-yyyy" : undefined}
                  onChange={(event) => onDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") onCancel();
                  }}
                  className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-900 outline-none focus:border-[var(--accent)]"
                />
              )}
              <div className="flex items-center gap-2">
                <button type="submit" disabled={pending} className="text-sm font-semibold text-[var(--brand)] disabled:opacity-60">
                  {pending ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={onCancel} className="text-sm text-stone-500">
                  Cancel
                </button>
              </div>
            </form>
          );
        })}
      </div>
    </section>
  );
}

function fieldBody(key: ConfigKey, draft: string): Partial<MessWrite> | string {
  const trimmed = draft.trim();
  if (key === "name" || key === "address" || key === "district" || key === "pincode" || key === "contact_no") {
    if (!trimmed) return "That field is required.";
    return { [key]: trimmed };
  }
  if (key === "email") return { email: trimmed || null };
  if (key === "fund_type") return { fund_type: trimmed === "mess_and_manager" ? "mess_and_manager" : "manager_only" };
  if (key === "monthly_due_date") return { monthly_due_date: trimmed || null };
  if (key === "s_deposite_amount") {
    if (!trimmed) return { s_deposite_amount: null };
    const amount = Number(trimmed);
    if (!Number.isFinite(amount)) return "Enter a valid amount.";
    return { s_deposite_amount: amount };
  }
  const amount = trimmed === "" ? 0 : Number(trimmed);
  if (!Number.isFinite(amount)) return "Enter a valid amount.";
  if (key === "monthly_due_amount") return { monthly_due_amount: amount };
  return { late_fee_amount: amount };
}

function textOf(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function moneyOf(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return inr(Number(value));
}

function MealSetup({ house, canEdit, role }: { house: House | null; canEdit: boolean; role: Role }) {
  const meals = useApi(messService.guestMeals, Boolean(house?.id) && canEdit);
  const menus = useApi(() => menuService.fetch(role), Boolean(house?.id));
  const menuTable = useClientPage(menus.data?.data ?? []);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function addMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await messService.saveGuestMeal({
        meal_name: String(data.get("meal_name") ?? ""),
        price: numberValue(data.get("price")),
      });
      form.reset();
      setDone(result.message);
      meals.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the guest meal.");
    } finally {
      setPending(false);
    }
  }

  async function saveMenu(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await menuService.save(role, {
        menu_date: String(data.get("menu_date") ?? ""),
        meal_type: String(data.get("meal_type") ?? "lunch") as "lunch" | "dinner",
        dishes: String(data.get("dishes") ?? ""),
      });
      form.reset();
      setDone(result.message);
      menus.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the menu.");
    } finally {
      setPending(false);
    }
  }

  if (!house?.id) {
    return <Notice>Save the mess config first.</Notice>;
  }

  return (
    <div className="space-y-4">
      {error || meals.error ? <Notice>{error || meals.error}</Notice> : null}
      {done ? <p className="text-sm text-emerald-800">{done}</p> : null}
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Guest meal prices</h2>
        <p className="mt-1 text-sm text-stone-500">What a guest pays for each plate. Only the president saves these.</p>
        <div className="mt-3 grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(meals.data?.data ?? []).map((row) => (
            <GuestMealCard key={row.id} row={row} canEdit={canEdit} onChanged={(message) => { setDone(message); setError(null); meals.reload(); }} onFailed={setError} />
          ))}
          {!meals.loading && (meals.data?.data.length ?? 0) === 0 && !canEdit ? <p className="text-sm text-stone-500">No guest meals yet.</p> : null}
          {canEdit ? (
            <form onSubmit={addMeal} className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-stone-300 bg-white p-4 shadow-sm shadow-stone-900/5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <Icon name="meals" className="h-4 w-4" />
                </span>
                <input name="meal_name" required placeholder="Meal name" aria-label="Meal name" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-stone-950 outline-none placeholder:font-medium placeholder:text-stone-400" />
                <button type="submit" disabled={pending} className="shrink-0 rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
                  {pending ? "Adding…" : "Add"}
                </button>
              </div>
              <input name="price" type="number" min="0" step="0.01" required placeholder="Price" aria-label="Price" className="mt-3 w-full bg-transparent text-2xl font-semibold tracking-tight text-stone-950 outline-none placeholder:text-stone-300" />
            </form>
          ) : null}
        </div>
      </div>
      <form onSubmit={saveMenu} className={panelCard}>
        <h2 className="text-sm font-semibold text-stone-900">Menu</h2>
        <p className="mt-1 text-sm text-stone-500">Lunch or dinner for a date. The president and the manager can save this.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Date" name="menu_date" type="date" />
          <label className="block text-sm text-stone-600">
            Meal
            <select name="meal_type" defaultValue="lunch" className={fieldClass}>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </label>
          <label className="block text-sm text-stone-600 sm:col-span-2">
            Dishes
            <input name="dishes" required className={fieldClass} placeholder="Rice, dal, fish curry" />
          </label>
        </div>
        <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
          {pending ? "Saving…" : "Save menu"}
        </button>
      </form>
      <TableShell
        count={menuTable.count}
        limit={menuTable.limit}
        offset={menuTable.offset}
        onLimit={menuTable.setLimit}
        onOffset={menuTable.setOffset}
        head={
          <tr>
            <th className={thClass()}>Meal</th>
            <th className={thClass()}>Date</th>
            <th className={thClass()}>Dishes</th>
          </tr>
        }
      >
        <TableStatus colSpan={3} loading={menus.loading} empty={!menus.loading && menuTable.count === 0 ? "No meals yet." : null} />
        {menuTable.page.map((row) => (
          <tr key={row.id} className={rowClass}>
            <td className="px-4 py-3 font-medium capitalize text-stone-950">{row.meal_type}</td>
            <td className="px-4 py-3 text-stone-600">{row.menu_date}</td>
            <td className="px-4 py-3 text-stone-700">{row.dishes}</td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

function GuestMealCard({
  row,
  canEdit,
  onChanged,
  onFailed,
}: {
  row: GuestMealSetup;
  canEdit: boolean;
  onChanged: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.meal_name);
  const [price, setPrice] = useState(String(row.price));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    setPending(true);
    try {
      const result = await messService.saveGuestMeal({
        id: row.id,
        meal_name: name.trim(),
        price: numberValue(price),
      });
      setEditing(false);
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not save the guest meal.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    setPending(true);
    try {
      const result = await messService.removeGuestMeal(row.id);
      onChanged(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not delete the guest meal.");
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={onSubmit} className="flex h-full flex-col justify-between rounded-2xl border border-[var(--accent)] bg-white p-4 shadow-sm shadow-stone-900/5">
        <div className="flex items-center gap-1">
          <input value={name} onChange={(event) => setName(event.target.value)} required autoFocus aria-label="Meal name" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-stone-950 outline-none" />
          <button type="submit" disabled={pending} className="shrink-0 text-xs font-semibold text-[var(--brand)] disabled:opacity-60">
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => { setEditing(false); setName(row.meal_name); setPrice(String(row.price)); }} className="shrink-0 text-xs font-semibold text-stone-500">
            Cancel
          </button>
        </div>
        <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="0.01" required aria-label="Price" className="mt-3 w-full bg-transparent text-2xl font-semibold tracking-tight text-stone-950 outline-none" />
      </form>
    );
  }

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
          <Icon name="meals" className="h-4 w-4" />
        </span>
        <h3 className="min-w-0 flex-1 truncate font-semibold tracking-tight text-stone-950">{row.meal_name}</h3>
        {canEdit ? (
          <div className="flex shrink-0">
            <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${row.meal_name}`} title={`Edit ${row.meal_name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-[var(--accent-soft)] hover:text-[var(--brand)]">
              <Icon name="pencil" className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={onDelete} disabled={pending} aria-label={`Delete ${row.meal_name}`} title={`Delete ${row.meal_name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60">
              <Icon name="trash" className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">{inr(Number(row.price))}</p>
    </article>
  );
}

function AnalyticsReport({ role }: { role: Role }) {
  const report = useApi(() => dashboardService.fetch(role));
  const meals = useApi(() => mealService.fetch(role));
  const totals = report.data?.mess_totals;

  return (
    <div className="space-y-4">
      {report.error ? <Notice>{report.error}</Notice> : null}
      {report.loading ? <div className="h-28 animate-pulse rounded-2xl bg-white" /> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Deposits" value={inr(totals?.total_deposit)} icon="wallet" />
        <StatCard label="Expenses" value={inr(totals?.total_expense)} icon="meals" />
        <StatCard label="Balance" value={inr(totals?.balance)} icon="grid" />
        <StatCard label="Manager fund" value={inr(totals?.manager_fund)} icon="users" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mess fund" value={inr(totals?.mess_fund)} icon="building" />
        <StatCard label="Lunch on" value={meals.data?.summary.lunch_active ?? 0} icon="meals" />
        <StatCard label="Dinner on" value={meals.data?.summary.dinner_active ?? 0} icon="meals" />
        <StatCard label="My deposits" value={inr(report.data?.my_totals?.total_deposit)} icon="wallet" />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  disabled,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-stone-600">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        className={fieldClass}
      />
    </label>
  );
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}

function numberValue(value: FormDataEntryValue | null) {
  return optionalNumber(value) ?? 0;
}
