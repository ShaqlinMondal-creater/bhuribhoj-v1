"use client";

import { useEffect, useState } from "react";
import { useMessUser } from "@/components/auth/MessSession";
import { Icon } from "@/components/icons/Icon";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Flash } from "@/components/ui/Flash";
import { MaterialScope } from "@/components/ui/FilterBar";
import { Notice } from "@/components/ui/Notice";
import { initials } from "@/lib/format";
import { mealCatalog, mealIsOn, mealOrder, mealService, servedMealSlots, type MealAway, type MealRow, type MealSlot, type MessMeal } from "@/services/mealService";
import { memberService } from "@/services/memberService";
import type { LaravelUser, Role } from "@/types/auth";
import Autocomplete from "@mui/material/Autocomplete";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

const tabs = ["Daily Setup", "Leave / Off", "Calendar View"] as const;
type Tab = (typeof tabs)[number];

const mealMeta = Object.fromEntries(mealCatalog.map((meal) => [meal.type, meal])) as Record<MealSlot, (typeof mealCatalog)[number]>;

export function MealsScreen() {
  const user = useMessUser();
  const canManage = user?.role === "president" || user?.role === "manager" || user?.role === "admin";
  const [tab, setTab] = useState<Tab>("Daily Setup");

  useEffect(() => {
    if (window.location.hash === "#leave") setTab("Leave / Off");
  }, []);
  const [mealDate, setMealDate] = useState(todayDmy());
  const [rows, setRows] = useState<MealRow[]>([]);
  const [messMeals, setMessMeals] = useState<MessMeal[]>([]);
  const [aways, setAways] = useState<MealAway[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<MealAway | "new" | null>(null);
  const [presetUserId, setPresetUserId] = useState<number | null>(null);
  const [removing, setRemoving] = useState<MealAway | null>(null);
  const iso = isDmy(mealDate) ? isoFromDmy(mealDate) : "";

  useEffect(() => {
    if (!user || !iso) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([mealService.fetch(user.role, iso), mealService.aways(user.role), mealService.messMeals(user.role)])
      .then(([meals, awayPage, mealSetup]) => {
        if (cancelled) return;
        setRows(meals.data ?? []);
        setAways(awayPage.data ?? []);
        setMessMeals(mealSetup.data ?? []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load daily meals.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, iso, reloadKey]);

  if (!user) return <div className="h-40 animate-pulse rounded-2xl bg-white" />;

  const slots = servedMealSlots(messMeals);
  const todayIso = isoFromDmy(todayDmy());
  const onLeave = aways.filter((away) => slots.some((slot) => covers(away, iso || todayIso, slot)));
  const mine = rows.find((row) => Number(row.user?.id) === Number(user.id));
  const mineHere = slots.some((slot) => (mine ? mealOn(mine, slot) : false));

  function openAway(row?: MealAway, memberId?: number) {
    setPresetUserId(memberId ?? null);
    setEditing(row ?? "new");
  }

  async function toggleMeal(memberId: number, meal: MealSlot, turnOnMeal: boolean) {
    if (!user || !iso) return;
    if (!canManage && isLocked(iso, meal)) {
      setError(`${mealMeta[meal].label} is already locked. It closed at ${mealMeta[meal].lock}.`);
      setNotice(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (turnOnMeal) {
        const exact = aways.find((away) => away.user_id === memberId && isOneMeal(away, iso, meal, slots));
        if (exact) {
          await mealService.removeAway(user.role, exact.id);
          setNotice(mealNotice(rows, memberId, meal, true));
        } else if (aways.some((away) => away.user_id === memberId && covers(away, iso, meal))) {
          setError("This meal is inside a leave. Edit the leave to change it.");
          setNotice(null);
          return;
        }
      } else {
        const next = nextMeal(iso, meal, slots);
        await mealService.saveAway(user.role, {
          user_id: memberId,
          from_date: iso,
          from_meal: meal,
          to_date: next.date,
          to_meal: next.meal,
        });
        setNotice(mealNotice(rows, memberId, meal, false));
      }
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the meal.");
      setNotice(null);
    } finally {
      setBusy(false);
    }
  }

  async function markAll(which: "all" | MealSlot) {
    if (!user || !iso) return;
    const targets = which === "all" ? slots : [which];
    setBusy(true);
    setError(null);
    try {
      for (const row of rows) {
        const memberId = Number(row.user?.id);
        if (!memberId) continue;
        for (const meal of targets) {
          if (mealOn(row, meal)) continue;
          const exact = aways.find((away) => away.user_id === memberId && isOneMeal(away, iso, meal, slots));
          if (exact && (canManage || !isLocked(iso, meal))) await mealService.removeAway(user.role, exact.id);
        }
      }
      setNotice("Meals updated.");
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the meals.");
      setNotice(null);
    } finally {
      setBusy(false);
    }
  }

  async function setMessMeal(slot: MealSlot, turnOn: boolean) {
    if (!user) return;
    const activeNow = servedMealSlots(messMeals);
    if (!turnOn && activeNow.length <= 1 && activeNow.includes(slot)) {
      setError("Keep at least one meal on.");
      setNotice(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await mealService.saveMessMeal(user.role, { meals_type: slot, status: turnOn ? "active" : "inactive" });
      setNotice(result.message);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the meals.");
      setNotice(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <Flash message={notice} />
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard label="Total Members" value={rows.length} hint="Active members" tone="stone" icon="users" />
          {slots.map((slot) => {
            const on = rows.filter((row) => mealOn(row, slot)).length;
            const off = rows.length - on;
            return (
              <SummaryCard
                key={slot}
                label={`${mealMeta[slot].label} ON`}
                value={on}
                hint={off === 1 ? "1 member off" : `${off} members off`}
                tone={mealMeta[slot].tone}
                icon="meals"
              />
            );
          })}
          <SummaryCard label="On Leave" value={onLeave.length} hint={leaveHint(onLeave)} tone="rose" icon="building" />
        </div>
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">My Meal Status</h2>
            <span className="text-xs text-stone-400">Today</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Avatar name={user.name} />
            <div>
              <p className="text-sm font-medium text-stone-950">{user.name}</p>
              <p className="text-xs text-green-700">{mine && !mineHere ? "On leave" : "Present"}</p>
            </div>
          </div>
          <div className={`mt-3 grid gap-2 ${slots.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
            {slots.map((slot) => (
              <div key={slot} className={`rounded-xl px-3 py-2 ${toneBox[mealMeta[slot].tone]}`}>
                <p className="text-xs text-stone-500">{mealMeta[slot].label}</p>
                <p className="text-sm font-semibold">{mine && mealOn(mine, slot) ? "ON" : "OFF"}</p>
                <p className="text-[11px] text-stone-400">{mealMeta[slot].hours}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => openAway(undefined, Number(user.id))} className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800">
            Set Leave / Off
          </button>
        </section>
        <div className="min-w-0 rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 pt-3">
            <div className="flex gap-1">
              {tabs.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`border-b-2 px-3 py-2.5 text-sm font-medium ${tab === item ? "border-sky-600 text-sky-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <DateStepper value={mealDate} onChange={setMealDate} />
          </div>
          {tab === "Daily Setup" ? (
            <div className="p-4">
              <h2 className="text-base font-semibold text-stone-950">Set meal for each member</h2>
              <p className="mt-1 text-sm text-stone-500">Turn meals on or off for this day, or apply leave for a range of days.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs text-stone-500">
                      <th className="px-2 py-2 font-medium">#</th>
                      <th className="px-2 py-2 font-medium">Member Name</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      {slots.map((slot) => (
                        <th key={slot} className="px-2 py-2 font-medium">{mealMeta[slot].label}<span className="block font-normal">{mealMeta[slot].hours}</span></th>
                      ))}
                      <th className="px-2 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && rows.length === 0 ? (
                      <tr><td colSpan={4 + slots.length} className="px-2 py-8 text-center text-stone-500">Loading meals…</td></tr>
                    ) : null}
                    {!loading && rows.length === 0 ? (
                      <tr><td colSpan={4 + slots.length} className="px-2 py-8 text-center text-stone-500">No meals for this day.</td></tr>
                    ) : null}
                    {rows.map((row, index) => {
                      const memberId = Number(row.user?.id);
                      const leave = aways.find((away) => away.user_id === memberId && slots.some((slot) => covers(away, iso, slot)));
                      const present = slots.some((slot) => mealOn(row, slot));
                      const canEdit = canManage || memberId === Number(user.id);
                      return (
                        <tr key={row.id} className="border-b border-stone-50 last:border-b-0">
                          <td className="px-2 py-3 text-stone-400">{index + 1}</td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={row.user?.name ?? "Member"} />
                              <span className="font-medium text-stone-950">{row.user?.name ?? "Member"}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            {present && !leave ? (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Present</span>
                            ) : (
                              <div>
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">On Leave</span>
                                {leave ? <p className="mt-1 text-xs text-stone-400">{shortRange(leave)}</p> : null}
                              </div>
                            )}
                          </td>
                          {slots.map((slot) => (
                            <td key={slot} className="px-2 py-3">
                              <Switch on={mealOn(row, slot)} disabled={!canEdit || busy || (!canManage && isLocked(iso, slot))} label={`${mealMeta[slot].label} for ${row.user?.name ?? "member"}`} onClick={() => toggleMeal(memberId, slot, !mealOn(row, slot))} />
                            </td>
                          ))}
                          <td className="px-2 py-3">
                            <div className="flex justify-end">
                              {canEdit ? (
                                <IconButton
                                  label={`Edit leave for ${row.user?.name ?? "member"}`}
                                  icon="pencil"
                                  onClick={() => openAway(leave, memberId)}
                                />
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {tab === "Leave / Off" ? (
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-stone-950">Leave / Off</h2>
                <button type="button" onClick={() => openAway()} className="rounded-xl bg-emerald-800 px-3 py-2 text-sm font-semibold text-white">
                  Apply leave
                </button>
              </div>
              <ul className="mt-3 divide-y divide-stone-100">
                {aways.length === 0 ? <li className="py-6 text-sm text-stone-500">No one is marked away.</li> : null}
                {aways.map((away) => (
                  <li key={away.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={away.user?.name ?? "Member"} />
                      <div>
                        <p className="text-sm font-medium text-stone-950">{away.user?.name ?? "Member"}</p>
                        <p className="text-xs text-stone-500">{mealMoment(away.from_date, away.from_meal)}{away.to_date && away.to_meal ? ` → ${mealMoment(away.to_date, away.to_meal)}` : " · Still away"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LeaveBadge away={away} today={todayIso} />
                      <IconButton label="Edit leave" icon="pencil" onClick={() => openAway(away)} />
                      <IconButton label="Remove leave" icon="trash" onClick={() => setRemoving(away)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {tab === "Calendar View" ? (
            <MonthBoard
              value={mealDate}
              aways={aways}
              slots={slots}
              onPick={(value) => {
                setMealDate(value);
                setTab("Daily Setup");
              }}
              onMonth={setMealDate}
            />
          ) : null}
        </div>
        <aside className="space-y-3">
          {canManage ? (
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-900"><Icon name="mark" className="h-4 w-4" /> Quick Actions</h2>
              <p className="mt-3 text-xs font-medium text-stone-500">Meals for this mess</p>
              <div className="mt-2 space-y-2">
                {mealOrder.map((slot) => (
                  <div key={slot} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                    <span className="text-sm font-medium text-stone-800">{mealMeta[slot].label}</span>
                    <Switch
                      on={mealIsOn(messMeals, slot)}
                      disabled={busy}
                      label={`${mealMeta[slot].label} for this mess`}
                      onClick={() => setMessMeal(slot, !mealIsOn(messMeals, slot))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <ActionButton label={slots.length > 1 ? "Mark All Present (All Meals)" : "Mark All Present"} onClick={() => markAll("all")} disabled={busy} />
                {slots.map((slot) => (
                  <ActionButton key={slot} label={`Mark All ${mealMeta[slot].label} ON`} onClick={() => markAll(slot)} disabled={busy} />
                ))}
                <ActionButton label="Apply Leave for a Member" onClick={() => openAway()} disabled={busy} />
                <ActionButton label="Set Date Range" onClick={() => openAway()} disabled={busy} />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
      {editing ? (
        <AwayForm
          role={user.role}
          selfId={Number(user.id)}
          slots={slots}
          canChooseMember={canManage}
          presetUserId={presetUserId}
          row={editing === "new" ? undefined : editing}
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
      {removing ? (
        <RemoveAway
          role={user.role}
          row={removing}
          onClose={() => setRemoving(null)}
          onSaved={(message) => {
            setNotice(message);
            setError(null);
            setRemoving(null);
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

const toneBox = {
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  sky: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-700",
};

function SummaryCard({ label, value, hint, tone, icon }: { label: string; value: number; hint: string; tone: "stone" | "amber" | "green" | "sky" | "rose"; icon: "users" | "meals" | "building" }) {
  const toneClass = {
    stone: "bg-stone-100 text-stone-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    sky: "bg-sky-100 text-sky-700",
    rose: "bg-rose-100 text-rose-700",
  }[tone];
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-stone-950">{value}</p>
          <p className="text-xs text-stone-400">{hint}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon name={icon} />
        </span>
      </div>
    </article>
  );
}

function DateStepper({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-1 pb-2">
      <span className="mr-1 text-xs text-stone-400">Select Date</span>
      <button type="button" onClick={() => onChange(shiftDmy(value, -1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600" aria-label="Previous day">‹</button>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-28 rounded-lg border border-stone-200 px-2 text-center text-sm text-stone-800"
        aria-label="Meal date"
      />
      <button type="button" onClick={() => onChange(shiftDmy(value, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600" aria-label="Next day">›</button>
    </div>
  );
}

function Switch({ on, disabled, label, onClick }: { on: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition disabled:opacity-40 ${on ? "bg-green-500" : "bg-stone-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const tones = ["bg-green-100 text-green-800", "bg-sky-100 text-sky-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-violet-100 text-violet-800"];
  const tone = tones[name.charCodeAt(0) % tones.length];
  return <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${tone}`}>{initials(name) || "M"}</span>;
}

function ActionButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-medium text-stone-800 shadow-sm disabled:opacity-50">
      {label}
    </button>
  );
}

function LeaveBadge({ away, today }: { away: MealAway; today: string }) {
  const started = away.from_date.slice(0, 10) <= today;
  const ended = away.to_date ? away.to_date.slice(0, 10) < today : false;
  const label = ended ? "Past" : started ? "On Leave" : "Upcoming";
  const tone = ended ? "bg-stone-100 text-stone-600" : started ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

function MonthBoard({ value, aways, slots, onPick, onMonth }: { value: string; aways: MealAway[]; slots: MealSlot[]; onPick: (value: string) => void; onMonth: (value: string) => void }) {
  const [day, month, year] = isDmy(value) ? value.split("-").map(Number) : todayDmy().split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const count = new Date(year, month, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  const title = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-950">{title}</h2>
        <div className="flex gap-1">
          <button type="button" className="h-8 w-8 rounded-lg border border-stone-200" onClick={() => onMonth(shiftMonth(value, -1))} aria-label="Previous month">‹</button>
          <button type="button" className="h-8 w-8 rounded-lg border border-stone-200" onClick={() => onMonth(shiftMonth(value, 1))} aria-label="Next month">›</button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => <div key={name}>{name}</div>)}
        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} />;
          const dmy = `${String(cell).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
          const date = isoFromDmy(dmy);
          const marked = slots.some((slot) => aways.some((away) => covers(away, date, slot)));
          const selected = cell === day;
          return (
            <button key={dmy} type="button" onClick={() => onPick(dmy)} className={`rounded-lg py-2 text-sm ${selected ? "bg-sky-600 text-white" : marked ? "bg-rose-50 text-rose-700" : "text-stone-700 hover:bg-stone-50"}`}>
              {cell}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AwayForm({
  role,
  selfId,
  slots,
  canChooseMember,
  presetUserId,
  row,
  onClose,
  onSaved,
  onFailed,
}: {
  role: Role;
  selfId: number;
  slots: MealSlot[];
  canChooseMember: boolean;
  presetUserId?: number | null;
  row?: MealAway;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [members, setMembers] = useState<LaravelUser[]>([]);
  const [userId, setUserId] = useState<number | null>(row?.user_id ?? presetUserId ?? (canChooseMember ? null : selfId));
  const [fromDate, setFromDate] = useState(row ? dmyFromIso(row.from_date) : todayDmy());
  const choices = mealChoices(slots, row?.from_meal, row?.to_meal);
  const [fromMeal, setFromMeal] = useState<MealSlot>(row?.from_meal ?? choices[0] ?? "lunch");
  const [toDate, setToDate] = useState(row?.to_date ? dmyFromIso(row.to_date) : "");
  const [toMeal, setToMeal] = useState<MealSlot>(row?.to_meal ?? choices[1] ?? choices[0] ?? "dinner");
  const [note, setNote] = useState(row?.note ?? "");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const selected = members.find((member) => Number(member.id) === userId) ?? null;

  useEffect(() => {
    if (!canChooseMember) return;
    let cancelled = false;
    memberService
      .fetch(role, { status: "active", limit: 100 })
      .then((page) => {
        if (!cancelled) setMembers(page.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canChooseMember, role]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setFormError("Choose a member.");
      return;
    }
    if (!isDmy(fromDate)) {
      setFormError("Use dd-mm-yyyy for the away date.");
      return;
    }
    if (toDate && !isDmy(toDate)) {
      setFormError("Use dd-mm-yyyy for the return date.");
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      const result = await mealService.saveAway(role, {
        id: row?.id,
        user_id: userId,
        from_date: isoFromDmy(fromDate),
        from_meal: fromMeal,
        to_date: toDate ? isoFromDmy(toDate) : null,
        to_meal: toDate ? toMeal : null,
        note: note.trim() || undefined,
      });
      onSaved(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save the away.";
      setFormError(message);
      onFailed(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog title={row ? "Edit leave" : "Apply leave"} onClose={onClose} size="lg" backdrop="stone">
      <MaterialScope>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          {canChooseMember ? (
            <Autocomplete
              className="sm:col-span-2"
              options={members}
              value={selected}
              getOptionLabel={(member) => (member.member_code ? `${member.name} · ${member.member_code}` : member.name)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => setUserId(value ? Number(value.id) : null)}
              renderInput={(params) => <TextField {...params} required label="Member" />}
            />
          ) : null}
          <TextField required label="Away from" value={fromDate} placeholder="dd-mm-yyyy" onChange={(event) => setFromDate(event.target.value)} />
          <TextField select required label="First meal off" value={fromMeal} onChange={(event) => setFromMeal(event.target.value as MealSlot)}>
            {choices.map((slot) => <MenuItem key={slot} value={slot}>{mealMeta[slot].label}</MenuItem>)}
          </TextField>
          <TextField label="Back on" value={toDate} placeholder="dd-mm-yyyy" onChange={(event) => setToDate(event.target.value)} />
          <TextField select label="First meal on" value={toMeal} onChange={(event) => setToMeal(event.target.value as MealSlot)} disabled={!toDate.trim()}>
            {choices.map((slot) => <MenuItem key={slot} value={slot}>{mealMeta[slot].label}</MenuItem>)}
          </TextField>
          <TextField className="sm:col-span-2" label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
          {formError ? <p className="text-sm text-red-700 sm:col-span-2">{formError}</p> : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">Cancel</button>
            <button type="submit" disabled={pending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </MaterialScope>
    </Dialog>
  );
}

function RemoveAway({
  role,
  row,
  onClose,
  onSaved,
  onFailed,
}: {
  role: Role;
  row: MealAway;
  onClose: () => void;
  onSaved: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);

  async function onConfirm() {
    setPending(true);
    try {
      const result = await mealService.removeAway(role, row.id);
      onSaved(result.message);
    } catch (err) {
      onFailed(err instanceof Error ? err.message : "Could not remove the away.");
      setPending(false);
    }
  }

  return (
    <Dialog title="Remove leave" onClose={onClose} backdrop="stone">
      <p className="text-sm text-stone-600">Remove the leave for {row.user?.name ?? "this member"}? Locked meals stay as they are.</p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700">Cancel</button>
        <button type="button" disabled={pending} onClick={onConfirm} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Removing…" : "Remove"}</button>
      </div>
    </Dialog>
  );
}

function leaveHint(aways: MealAway[]) {
  const dated = aways.map((away) => away.to_date).filter((value): value is string => Boolean(value)).sort();
  if (aways.length === 0) return "No one away";
  if (!dated[0]) return "Still away";
  return `Till ${shortDate(dated[0])}`;
}

function shortRange(away: MealAway) {
  if (!away.to_date) return `From ${shortDate(away.from_date)}`;
  return `${shortDate(away.from_date)} – ${shortDate(away.to_date)}`;
}

function shortDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 6));
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(date);
}

function mealChoices(slots: MealSlot[], ...extra: Array<MealSlot | null | undefined>) {
  const picked = new Set<MealSlot>(slots);
  extra.forEach((slot) => {
    if (slot) picked.add(slot);
  });
  const list = mealOrder.filter((slot) => picked.has(slot));
  return list.length ? list : (["lunch", "dinner"] as MealSlot[]);
}

function mealNotice(list: MealRow[], memberId: number, meal: MealSlot, on: boolean) {
  const name = list.find((row) => Number(row.user?.id) === memberId)?.user?.name ?? "Member";
  return `${name}'s ${mealMeta[meal].label} is ${on ? "on" : "off"}.`;
}

function mealOn(row: MealRow, slot: MealSlot) {
  return Boolean(row[`${slot}_active` as keyof MealRow]);
}

function mealRank(meal: MealSlot) {
  const index = mealOrder.indexOf(meal);
  return String(index < 0 ? 2 : index);
}

function mealMoment(date: string, meal: MealSlot) {
  return `${shortDate(date)} ${mealMeta[meal].label}`;
}

function covers(away: MealAway, date: string, meal: MealSlot) {
  const point = `${date.slice(0, 10)} ${mealRank(meal)}`;
  const start = `${away.from_date.slice(0, 10)} ${mealRank(away.from_meal)}`;
  if (point < start) return false;
  if (!away.to_date || !away.to_meal) return true;
  return point < `${away.to_date.slice(0, 10)} ${mealRank(away.to_meal)}`;
}

function isOneMeal(away: MealAway, date: string, meal: MealSlot, slots: MealSlot[]) {
  const next = nextMeal(date, meal, slots);
  return away.from_date.slice(0, 10) === date && away.from_meal === meal && away.to_date?.slice(0, 10) === next.date && away.to_meal === next.meal;
}

function nextMeal(date: string, meal: MealSlot, slots: MealSlot[]) {
  const list = slots.length ? slots : (["lunch", "dinner"] as MealSlot[]);
  const index = list.indexOf(meal);
  if (index >= 0 && index < list.length - 1) return { date, meal: list[index + 1] };
  return { date: shiftIso(date, 1), meal: list[0] };
}

function isLocked(date: string, meal: MealSlot) {
  const now = kolkataParts(new Date());
  const [year, month, day] = date.split("-").map(Number);
  const hour = mealMeta[meal].hour;
  const minute = mealMeta[meal].minute;
  const current = now.year * 1e8 + now.month * 1e6 + now.day * 1e4 + now.hour * 100 + now.minute;
  return current >= year * 1e8 + month * 1e6 + day * 1e4 + hour * 100 + minute;
}

function kolkataParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute") };
}

function todayDmy() {
  const now = kolkataParts(new Date());
  return `${String(now.day).padStart(2, "0")}-${String(now.month).padStart(2, "0")}-${now.year}`;
}

function dmyFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return todayDmy();
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

function shiftDmy(value: string, days: number) {
  if (!isDmy(value)) return todayDmy();
  return dmyFromIso(shiftIso(isoFromDmy(value), days));
}

function shiftMonth(value: string, months: number) {
  if (!isDmy(value)) return todayDmy();
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const nextDay = Math.min(day, last);
  return `${String(nextDay).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function shiftIso(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
