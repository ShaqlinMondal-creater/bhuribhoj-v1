"use client";

import { useEffect, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { Icon } from "@/components/icons/Icon";
import { Dialog } from "@/components/ui/Dialog";
import { MaterialScope } from "@/components/ui/FilterBar";
import { Notice } from "@/components/ui/Notice";
import { notifyTodayMenuSaved, onTodayMenuOpen } from "@/lib/todayMenuEvents";
import { mealInfo, mealService, servedMealSlots, type MealSlot } from "@/services/mealService";
import { menuService } from "@/services/menuService";
import TextField from "@mui/material/TextField";

export function TodayMenuQuick() {
  const user = useMessUser();
  const lead = user?.role === "president" || user?.role === "manager";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!lead) return;
    return onTodayMenuOpen(() => setOpen(true));
  }, [lead]);

  if (!lead || !user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-900 md:bottom-8 md:right-8"
        aria-label="Add today's menu"
      >
        <Icon name="meals" className="h-4 w-4" />
        <span>Today&apos;s menu</span>
      </button>
      {open ? (
        <TodayMenuDialog
          onClose={() => setOpen(false)}
          onSaved={() => {
            notifyTodayMenuSaved();
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function TodayMenuDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const user = useMessUser();
  const today = todayIsoKolkata();
  const label = longTodayLabel(today);
  const [slots, setSlots] = useState<MealSlot[]>([]);
  const [dishes, setDishes] = useState<Partial<Record<MealSlot, string>>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      mealService.messMeals(user.role),
      menuService.fetch(user.role, { from_date: today, to_date: today }),
    ])
      .then(([meals, menus]) => {
        if (cancelled) return;
        const active = servedMealSlots(meals.data ?? []);
        const next: Partial<Record<MealSlot, string>> = {};
        for (const slot of active) {
          const existing = (menus.data ?? []).find((row) => row.meal_type === slot);
          next[slot] = existing?.dishes ?? "";
        }
        setSlots(active);
        setDishes(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load today's menu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, today]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const toSave = slots
      .map((slot) => ({ slot, text: (dishes[slot] ?? "").trim() }))
      .filter((item) => item.text !== "");
    if (toSave.length === 0) {
      setError("Add dishes for at least one meal.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      for (const item of toSave) {
        await menuService.save(user.role, {
          menu_date: today,
          meal_type: item.slot,
          dishes: item.text,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save today's menu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title="Today's menu" onClose={onClose} size="lg" backdrop="stone">
      <p className="mb-4 text-sm text-stone-600">Set dishes for {label}. Empty meals are skipped.</p>
      {loading ? <p className="text-sm text-stone-500">Loading meals…</p> : null}
      {!loading && slots.length === 0 ? <Notice>Turn on at least one meal in Mess Config first.</Notice> : null}
      {error ? <Notice>{error}</Notice> : null}
      {!loading && slots.length > 0 ? (
        <MaterialScope>
          <form onSubmit={onSubmit} className="grid gap-3">
            {slots.map((slot) => (
              <TextField
                key={slot}
                fullWidth
                label={mealInfo(slot).label}
                value={dishes[slot] ?? ""}
                placeholder="Rice, dal, fish curry"
                onChange={(event) => setDishes((prev) => ({ ...prev, [slot]: event.target.value }))}
              />
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save today's menu"}
              </button>
            </div>
          </form>
        </MaterialScope>
      ) : null}
    </Dialog>
  );
}

function todayIsoKolkata() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function longTodayLabel(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "today";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 6));
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
