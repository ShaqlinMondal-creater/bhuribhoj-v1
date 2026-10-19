"use client";

import { useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useApi } from "@/hooks/useApi";
import { isPresident } from "@/lib/auth/roles";
import { inr } from "@/lib/format";
import { dashboardService } from "@/services/dashboardService";
import { mealService } from "@/services/mealService";
import { menuService } from "@/services/menuService";
import { messService, type House } from "@/services/messService";

const tabs = [
  { id: "config", label: "Mess config" },
  { id: "meals", label: "Meal setup" },
  { id: "reports", label: "Analytics reports" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function HouseScreen() {
  const user = useMessUser();
  const president = isPresident(user?.role);
  const [tab, setTab] = useState<TabId>("config");
  const house = useApi(messService.house);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="House"
        title={house.data?.data.name ?? "Mess house"}
        description="Mess config, meal setup, and the month's reports."
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
        ) : house.data?.data ? (
          <MessConfig house={house.data.data} canEdit={president} onSaved={house.reload} />
        ) : null
      ) : null}
      {tab === "meals" ? (
        <MealSetup house={house.data?.data ?? null} canEditPrices={president} onSaved={house.reload} />
      ) : null}
      {tab === "reports" ? <AnalyticsReport /> : null}
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
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await messService.update({
        name: String(data.get("name") ?? ""),
        address: String(data.get("address") ?? ""),
        district: String(data.get("district") ?? ""),
        pincode: String(data.get("pincode") ?? ""),
        contact_no: String(data.get("contact_no") ?? ""),
        email: String(data.get("email") ?? ""),
        fund_mode: String(data.get("fund_mode") ?? house.fund_mode),
        monthly_due_amount: Number(data.get("monthly_due_amount")),
        monthly_due_day: Number(data.get("monthly_due_day")),
        late_fee_amount: Number(data.get("late_fee_amount")),
      });
      setDone(result.message);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the mess.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
      <h2 className="text-sm font-semibold text-stone-900">Mess config</h2>
      <p className="mt-1 text-sm text-stone-500">Name, address, fund, and the monthly due. A manager can read this and cannot save it.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={house.name} disabled={!canEdit} />
        <Field label="Code" name="code" defaultValue={house.code} disabled />
        <Field label="Address" name="address" defaultValue={house.address} disabled={!canEdit} />
        <Field label="District" name="district" defaultValue={house.district} disabled={!canEdit} />
        <Field label="Pincode" name="pincode" defaultValue={house.pincode} disabled={!canEdit} />
        <Field label="Contact" name="contact_no" defaultValue={house.contact_no} disabled={!canEdit} />
        <Field label="Email" name="email" type="email" defaultValue={house.email} disabled={!canEdit} />
        <label className="block text-sm text-stone-600">
          Fund
          <select name="fund_mode" defaultValue={house.fund_mode} disabled={!canEdit} className={fieldClass}>
            <option value="manager_only">Manager fund only</option>
            <option value="mess_and_manager">Mess fund and manager fund</option>
          </select>
        </label>
        <Field label="Monthly due" name="monthly_due_amount" type="number" defaultValue={String(house.monthly_due_amount)} disabled={!canEdit} />
        <Field label="Due day" name="monthly_due_day" type="number" defaultValue={String(house.monthly_due_day)} disabled={!canEdit} />
        <Field label="Late fee" name="late_fee_amount" type="number" defaultValue={String(house.late_fee_amount)} disabled={!canEdit} />
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-emerald-800">{done}</p> : null}
      {canEdit ? (
        <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
          {pending ? "Saving…" : "Save config"}
        </button>
      ) : null}
    </form>
  );
}

function MealSetup({
  house,
  canEditPrices,
  onSaved,
}: {
  house: House | null;
  canEditPrices: boolean;
  onSaved: () => void;
}) {
  const menus = useApi(menuService.fetch);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function savePrices(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEditPrices || !house) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await messService.update({
        guest_chicken_price: Number(data.get("guest_chicken_price")),
        guest_fish_price: Number(data.get("guest_fish_price")),
        guest_egg_price: Number(data.get("guest_egg_price")),
        guest_veg_price: Number(data.get("guest_veg_price")),
      });
      setDone(result.message);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save meal prices.");
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
      const result = await menuService.save({
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

  return (
    <div className="space-y-4">
      {error ? <Notice>{error}</Notice> : null}
      {done ? <p className="text-sm text-emerald-800">{done}</p> : null}
      {house ? (
        <form onSubmit={savePrices} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
          <h2 className="text-sm font-semibold text-stone-900">Guest meal prices</h2>
          <p className="mt-1 text-sm text-stone-500">What a guest pays for each plate. Only the president saves these.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Chicken" name="guest_chicken_price" type="number" defaultValue={String(house.guest_chicken_price)} disabled={!canEditPrices} />
            <Field label="Fish" name="guest_fish_price" type="number" defaultValue={String(house.guest_fish_price)} disabled={!canEditPrices} />
            <Field label="Egg" name="guest_egg_price" type="number" defaultValue={String(house.guest_egg_price)} disabled={!canEditPrices} />
            <Field label="Veg" name="guest_veg_price" type="number" defaultValue={String(house.guest_veg_price)} disabled={!canEditPrices} />
          </div>
          {canEditPrices ? (
            <button type="submit" disabled={pending} className="mt-4 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
              {pending ? "Saving…" : "Save prices"}
            </button>
          ) : null}
        </form>
      ) : null}
      <form onSubmit={saveMenu} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5">
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
      {(menus.data?.data.length ?? 0) > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {menus.data?.data.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5 last:border-0">
              <div>
                <p className="text-sm font-medium capitalize text-stone-900">{row.meal_type}</p>
                <p className="text-xs text-stone-500">{row.menu_date}</p>
              </div>
              <p className="max-w-sm text-right text-sm text-stone-700">{row.dishes}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AnalyticsReport() {
  const report = useApi(dashboardService.fetch);
  const meals = useApi(mealService.fetch);
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
      {(report.data?.my_totals?.pending_dues.length ?? 0) > 0 ? (
        <ul className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {report.data?.my_totals?.pending_dues.map((due) => (
            <li key={due.id} className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5 last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-900">{due.month}</p>
                <p className="text-xs capitalize text-stone-500">{due.status}</p>
              </div>
              <p className="text-sm font-semibold text-stone-900">{inr(Number(due.amount) + Number(due.late_fee))}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm text-stone-600">
      {label}
      <input name={name} type={type} defaultValue={defaultValue} disabled={disabled} required={type === "date"} step={type === "number" ? "0.01" : undefined} className={fieldClass} />
    </label>
  );
}

const fieldClass = "mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-700 disabled:bg-stone-50 disabled:text-stone-500";
