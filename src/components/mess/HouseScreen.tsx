"use client";

import { useState } from "react";
import { useMessUser, useSetMessSeat, useSetMessUser } from "@/components/auth/MessSession";
import { fieldClass as baseFieldClass, panelCard } from "@/components/ui/classes";
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
import { messService, type GuestMealSetup, type House } from "@/services/messService";

const fieldClass = `${baseFieldClass} disabled:bg-stone-50 disabled:text-stone-500`;

const tabs = [
  { id: "config", label: "Mess config" },
  { id: "meals", label: "Meal setup" },
  { id: "reports", label: "Reports" },
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
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === item.id ? "bg-emerald-800 text-white" : "bg-white text-stone-600 hover:bg-stone-100"
            }`}
          >
            {item.label}
          </button>
        ))}
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
      <div className={panelCard}>
        <h2 className="text-sm font-semibold text-stone-900">Guest meal prices</h2>
        <p className="mt-1 text-sm text-stone-500">What a guest pays for each plate. Only the president saves these.</p>
        <div className="mt-4 space-y-3">
          {(meals.data?.data ?? []).map((row) => (
            <GuestMealRow key={row.id} row={row} canEdit={canEdit} onChanged={(message) => { setDone(message); setError(null); meals.reload(); }} onFailed={setError} />
          ))}
          {!meals.loading && (meals.data?.data.length ?? 0) === 0 ? <p className="text-sm text-stone-500">No guest meals yet.</p> : null}
        </div>
        {canEdit ? (
          <form onSubmit={addMeal} className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
            <input name="meal_name" required placeholder="Meal name" className={fieldClass} />
            <input name="price" type="number" min="0" step="0.01" required placeholder="Price" className={fieldClass} />
            <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
              Add
            </button>
          </form>
        ) : null}
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

function GuestMealRow({
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    try {
      const result = await messService.saveGuestMeal({
        id: row.id,
        meal_name: String(data.get("meal_name") ?? ""),
        price: numberValue(data.get("price")),
      });
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

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
      <input name="meal_name" defaultValue={row.meal_name} disabled={!canEdit} required className={fieldClass} />
      <input name="price" type="number" min="0" step="0.01" defaultValue={String(row.price)} disabled={!canEdit} required className={fieldClass} />
      {canEdit ? (
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            Save
          </button>
          <button type="button" disabled={pending} onClick={onDelete} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 disabled:opacity-60">
            Delete
          </button>
        </div>
      ) : null}
    </form>
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
