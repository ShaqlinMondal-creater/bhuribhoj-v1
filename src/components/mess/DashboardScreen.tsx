"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useMessUser } from "@/components/auth/MessSession";
import { FilterDate, MaterialScope } from "@/components/ui/FilterBar";
import { Notice } from "@/components/ui/Notice";
import { inr, initials } from "@/lib/format";
import { dashboardService, type DashboardPayload } from "@/services/dashboardService";
import { mealInfo, type MealSlot } from "@/services/mealService";

export function DashboardScreen() {
  const user = useMessUser();
  const [fromDate, setFromDate] = useState(() => monthStartDmy());
  const [toDate, setToDate] = useState(() => todayDmy());
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const mine = data?.my_totals;
  const totals = data?.mess_totals;
  const chart = data?.chart ?? [];
  const today = mine?.today ?? [];
  const activity = data?.activity ?? [];
  const rangeReady = isDmy(fromDate) && isDmy(toDate);
  const canLead = user?.role === "president" || user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    if (!user || !rangeReady) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    dashboardService
      .fetch(user.role, { from_date: isoFromDmy(fromDate), to_date: isoFromDmy(toDate) })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, fromDate, toDate, rangeReady]);

  return (
    <section className="space-y-5">
      {error ? <Notice>{error}</Notice> : null}
      {loading && !data ? <div className="h-24 animate-pulse rounded-2xl bg-white" /> : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid h-full gap-3 sm:grid-cols-3">
          <DashCard label="Mess deposits" value={inr(totals?.total_deposit)} tone="rose" icon="coin" change={totals?.deposit_change} series={chart.map((point) => point.deposits)} />
          <DashCard label="Mess expenses" value={inr(totals?.total_expense)} tone="pink" icon="receipt" change={totals?.expense_change} series={chart.map((point) => point.expenses)} />
          <DashCard label="Balance" value={inr(totals?.balance)} tone="green" icon="scale" change={totals?.balance_change} series={chart.map((point) => point.balance ?? 0)} />
        </div>
        <section className="flex h-full flex-col rounded-2xl border border-stone-200/80 bg-white p-3 shadow-sm shadow-stone-900/5">
          <h2 className="text-xs font-semibold text-stone-950">Quick actions</h2>
          <div className="mt-2 grid flex-1 grid-cols-2 gap-1.5">
            <Action href="/mess/daily-meals" title="Set today's meals" copy="Mark meals on or off" tone="amber" icon="meals" />
            <Action href="/mess/daily-meals#leave" title="Apply leave" copy="Set a date range" tone="rose" icon="calendar" />
            {canLead ? <Action href="/mess/members" title="Add member" copy="Register a member" tone="sky" icon="user" /> : null}
            {canLead ? <Action href="/mess/expenses" title="Add expense" copy="Record an expense" tone="violet" icon="receipt" /> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm shadow-stone-900/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-950">Daily activity</h2>
              <p className="mt-1 text-sm text-stone-500">Deposits, expenses, balance, and meals for each day.</p>
            </div>
            <MaterialScope>
              <div className="flex flex-wrap gap-2">
                <FilterDate label="From" value={fromDate} onChange={setFromDate} />
                <FilterDate label="To" value={toDate} onChange={setToDate} />
              </div>
            </MaterialScope>
          </div>
          {!rangeReady ? <p className="mt-3 text-sm text-stone-500">Use dd-mm-yyyy for both dates.</p> : null}
          <ActivityChart points={chart} fromDate={fromDate} />
        </section>

        <aside className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5">
          <Link href="/mess/profile" className="flex items-center gap-3 bg-stone-950 px-4 py-4 text-white">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-ink)]">
              {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : initials(user?.name ?? "M")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{user?.name ?? "Member"}</span>
              <span className="block truncate text-xs capitalize text-stone-400">{user?.role ?? "member"}{user?.memberCode ? ` · ${user.memberCode}` : ""}</span>
            </span>
            <Chevron />
          </Link>
          <div className="grid grid-cols-2 gap-2 p-4">
            <MiniStat label="Total deposits" value={inr(mine?.total_deposit)} tone="gold" icon="coin" />
            <MiniStat label="This month" value={inr(mine?.month_deposit)} tone="gold" icon="calendar" />
            <MiniStat label="Total meals" value={String(mine?.total_meals ?? 0)} tone="green" icon="meals" />
            <MiniStat label="This month meals" value={String(mine?.month_meals ?? 0)} tone="green" icon="meals" />
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-700">Today&apos;s meal status</p>
              <Link href="/mess/daily-meals" className="text-xs font-medium text-sky-700">Manage ›</Link>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {today.length === 0 ? <p className="text-sm font-semibold text-stone-950">—</p> : null}
              {today.map((meal) => (
                <MealStatus key={meal.meal} meal={meal.meal} label={meal.label} on={meal.on} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm shadow-stone-900/5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-950">Recent transactions</h2>
            <Link href={user?.role === "president" ? "/mess/deposits" : "/mess/expenses"} className="text-xs font-medium text-sky-700">View all ›</Link>
          </div>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-stone-500">No transactions yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead>
                  <tr className="text-xs text-stone-400">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row, index) => (
                    <tr key={`${row.kind}-${row.date}-${index}`} className="border-t border-stone-100">
                      <td className="py-3 text-stone-600">{shortDate(row.date)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.kind === "deposit" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                          {row.kind === "deposit" ? "Deposit" : "Expense"}
                        </span>
                      </td>
                      <td className="py-3 text-stone-700">{row.title}</td>
                      <td className={`py-3 text-right font-medium ${row.kind === "deposit" ? "text-green-700" : "text-rose-600"}`}>{inr(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </section>
  );
}

function DashCard({
  label,
  value,
  tone,
  icon,
  change,
  href,
  series,
}: {
  label: string;
  value: string;
  tone: "rose" | "pink" | "green" | "sky";
  icon: IconName;
  change?: number | null;
  href?: string;
  series: number[];
}) {
  const surface = {
    rose: "bg-rose-50",
    pink: "bg-rose-50/70",
    green: "bg-green-50",
    sky: "bg-sky-50",
  }[tone];
  const badge = {
    rose: "bg-rose-100 text-rose-600",
    pink: "bg-rose-100 text-rose-600",
    green: "bg-green-100 text-green-700",
    sky: "bg-sky-100 text-sky-700",
  }[tone];
  const stroke = {
    rose: "#e11d48",
    pink: "#f43f5e",
    green: "#16a34a",
    sky: "#0284c7",
  }[tone];
  return (
    <article className={`flex h-full flex-col rounded-2xl p-3 ${surface}`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${badge}`}>
          <DashIcon name={icon} />
        </span>
        {change != null ? <ChangePill value={change} /> : null}
      </div>
      <p className="mt-2 text-xs text-stone-500">{label}</p>
      <div className="mt-0.5 flex items-end justify-between gap-2">
        <p className="text-lg font-semibold tracking-tight text-stone-950">{value}</p>
        {href ? <Link href={href} className="mb-0.5 text-xs font-medium text-sky-700">View ›</Link> : null}
      </div>
      <div className="mt-auto">
        <Sparkline values={series} color={stroke} />
      </div>
    </article>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const width = 140;
  const height = 32;
  const max = Math.max(1, ...values, 0);
  const min = Math.min(0, ...values);
  const span = Math.max(1, max - min);
  const points = values.length > 0 ? values : [0, 0];
  const line = points
    .map((value, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-1 h-6 w-full" aria-hidden>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangePill({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${up ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
      <span aria-hidden>{up ? "↗" : "↘"}</span>
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

type IconName = "coin" | "receipt" | "scale" | "user" | "calendar" | "meals";

function DashIcon({ name }: { name: IconName }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, className: "h-5 w-5", "aria-hidden": true } as const;
  if (name === "coin") {
    return (
      <svg {...common}>
        <ellipse cx="12" cy="7" rx="7" ry="3" />
        <path d="M5 7v4c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
        <path d="M5 11v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" />
      </svg>
    );
  }
  if (name === "receipt") {
    return (
      <svg {...common}>
        <path d="M7 3.5h10a1 1 0 0 1 1 1V20l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V4.5a1 1 0 0 1 1-1Z" />
        <path d="M9 8h6M9 12h6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "scale") {
    return (
      <svg {...common}>
        <path d="M12 4v16M8 20h8" strokeLinecap="round" />
        <path d="M12 7h6l2 4a3.2 3.2 0 0 1-6.2 0L12 7ZM12 7H6L4 11a3.2 3.2 0 0 0 6.2 0L12 7Z" />
      </svg>
    );
  }
  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5V7M16 3.5V7M4 10h16" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "meals") {
    return (
      <svg {...common}>
        <path d="M8 4v7M6 4v4.5a2 2 0 0 0 4 0V4M8 11v9" strokeLinecap="round" />
        <path d="M16 4c1.6 1.4 2 3.2 2 5.2 0 2-1 3.2-2 3.8V20" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 19.5v-1.2A3.8 3.8 0 0 1 9.8 14.5h4.4a3.8 3.8 0 0 1 3.8 3.8v1.2" strokeLinecap="round" />
    </svg>
  );
}

function MiniStat({ label, value, tone, icon }: { label: string; value: string; tone: "gold" | "green"; icon: IconName }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tone === "gold" ? "bg-amber-50" : "bg-green-50"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-stone-500">{label}</p>
        <span className={tone === "gold" ? "text-amber-600" : "text-green-600"}>
          <DashIcon name={icon} />
        </span>
      </div>
      <p className={`mt-1 text-sm font-semibold ${tone === "gold" ? "text-amber-800" : "text-green-700"}`}>{value}</p>
    </div>
  );
}

function MealStatus({ meal, label, on }: { meal: string; label: string; on: boolean }) {
  const info = mealInfo(meal as MealSlot);
  const night = meal === "dinner" || meal === "evening_snack" || meal === "late_night";
  return (
    <article className={`rounded-2xl px-3 py-3 ${night ? "bg-violet-50" : "bg-green-50"}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${night ? "bg-violet-100" : "bg-amber-100"}`}>
          {night ? <Moon /> : <Sun />}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${on ? (night ? "bg-violet-200 text-violet-800" : "bg-green-200 text-green-800") : "bg-stone-200 text-stone-500"}`}>
          {on ? "ON" : "OFF"}
        </span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${night ? "text-violet-800" : "text-green-800"}`}>{label}</p>
      <p className="text-[11px] text-stone-400">After {info.lock}</p>
    </article>
  );
}

function Action({ href, title, copy, tone, icon }: { href: string; title: string; copy: string; tone: "amber" | "rose" | "sky" | "violet"; icon: IconName }) {
  const surface = {
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
  }[tone];
  return (
    <Link href={href} className={`flex h-full flex-col justify-center rounded-xl px-2 py-1.5 transition hover:brightness-95 ${surface}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80">
        <DashIcon name={icon} />
      </span>
      <p className="mt-1 text-[11px] font-semibold leading-4 text-stone-900">{title}</p>
      <p className="text-[10px] leading-3 text-stone-500">{copy}</p>
    </Link>
  );
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" strokeLinecap="round" />
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16.5 14.5A6.5 6.5 0 0 1 9 6.2 6.5 6.5 0 1 0 16.5 14.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ChartPoint = { label: string; date?: string; deposits: number; mine?: number; expenses: number; balance?: number; meals?: number };

function ActivityChart({ points, fromDate }: { points: ChartPoint[]; fromDate: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [tipLeft, setTipLeft] = useState(0);
  if (points.length === 0) {
    return <p className="mt-8 text-sm text-stone-500">No activity yet.</p>;
  }

  const width = 640;
  const height = 210;
  const padTop = 22;
  const padLeft = 52;
  const plotWidth = width - padLeft - 8;
  const money = points.map((point) => [point.deposits, point.expenses, point.balance ?? 0]).flat();
  const moneyMax = Math.max(1, ...money) * 1.18;
  const mealMax = Math.max(1, ...points.map((point) => point.meals ?? 0)) * 1.18;
  const series = [
    { key: "meals", values: points.map((point) => point.meals ?? 0), max: mealMax, color: "#7c3aed" },
    { key: "balance", values: points.map((point) => point.balance ?? 0), max: moneyMax, color: "#22c55e" },
    { key: "deposits", values: points.map((point) => point.deposits), max: moneyMax, color: "#f59e0b" },
    { key: "expenses", values: points.map((point) => point.expenses), max: moneyMax, color: "#ef4444" },
  ];
  const active = hover == null ? null : points[hover];
  const activeX = hover == null ? 0 : pointAt(0, hover, points.length, 1, plotWidth, height, padLeft, padTop).x;

  function move(event: MouseEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const cursor = svg.createSVGPoint();
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    const local = cursor.matrixTransform(ctm.inverse());
    const ratio = (local.x - padLeft) / plotWidth;
    if (ratio < -0.02 || ratio > 1.02) {
      setHover(null);
      return;
    }
    const index = Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1))));
    const host = svg.parentElement?.getBoundingClientRect();
    const marker = svg.createSVGPoint();
    marker.x = pointAt(0, index, points.length, 1, plotWidth, height, padLeft, padTop).x;
    marker.y = padTop;
    const placed = marker.matrixTransform(ctm);
    if (host) setTipLeft(Math.max(8, Math.min(host.width - 188, placed.x - host.left - 88)));
    setHover(index);
  }

  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${width} ${padTop + height + 28}`} className="h-64 w-full" role="img" aria-label="Daily deposits, expenses, balance, and meals" onMouseMove={move} onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = padTop + height * step;
          return (
            <g key={step}>
              <line x1={padLeft} x2={width - 8} y1={y} y2={y} stroke="#f5f5f4" strokeWidth="1" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-stone-400" fontSize="11">
                {moneyTick(moneyMax * (1 - step))}
              </text>
            </g>
          );
        })}
        {series.map((line) => (
          <g key={line.key}>
            <polyline points={lineOf(line.values, line.max, plotWidth, height, padLeft, padTop)} fill="none" stroke={line.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {dotsOf(line.values, line.max, plotWidth, height, padLeft, padTop).map((dot, index) => (
              <circle key={`${line.key}-${index}`} cx={dot.x} cy={dot.y} r="3.2" fill="#fff" stroke={line.color} strokeWidth="2" />
            ))}
          </g>
        ))}
        {active && hover != null ? (
          <g>
            <line x1={activeX} x2={activeX} y1={padTop} y2={padTop + height} stroke="#a8a29e" strokeDasharray="3 3" />
            {series.map((line) => {
              const dot = pointAt(line.values[hover] ?? 0, hover, points.length, line.max, plotWidth, height, padLeft, padTop);
              return <circle key={`active-${line.key}`} cx={dot.x} cy={dot.y} r="4.5" fill={line.color} stroke="#fff" strokeWidth="1.5" />;
            })}
          </g>
        ) : null}
        {points.map((point, index) => {
          const show = index === 0 || index === points.length - 1 || Number(point.label) % 5 === 0;
          if (!show) return null;
          const x = padLeft + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
          return (
            <text key={`${point.label}-${index}`} x={x} y={padTop + height + 18} textAnchor="middle" className="fill-stone-400" fontSize="11">
              {point.label}
            </text>
          );
        })}
      </svg>
      {active ? (
        <div
          className="pointer-events-none absolute z-10 w-44 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: tipLeft, top: 4 }}
        >
          <p className="font-semibold text-stone-900">{pointDate(fromDate, hover ?? 0, active)}</p>
          <p className="mt-1 flex items-center justify-between gap-3 text-amber-600"><span>Deposits</span><span>{inr(active.deposits)}</span></p>
          <p className="flex items-center justify-between gap-3 text-rose-600"><span>Expenses</span><span>{inr(active.expenses)}</span></p>
          <p className="flex items-center justify-between gap-3 text-green-700"><span>Balance</span><span>{inr(active.balance)}</span></p>
          <p className="flex items-center justify-between gap-3 text-violet-700"><span>Meals</span><span>{active.meals ?? 0}</span></p>
        </div>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        <Legend color="#f59e0b" label="Deposits" />
        <Legend color="#ef4444" label="Expenses" />
        <Legend color="#22c55e" label="Balance" />
        <Legend color="#7c3aed" label="Meals" />
      </div>
    </div>
  );
}

function pointDate(fromDate: string, index: number, point: ChartPoint) {
  if (!isDmy(fromDate)) return point.date ?? point.label;
  const [day, month, year] = fromDate.split("-").map(Number);
  const date = new Date(year, month - 1, day + index);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function shortDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(date);
}

function monthStartDmy() {
  const now = kolkataParts(new Date());
  return `01-${String(now.month).padStart(2, "0")}-${now.year}`;
}

function todayDmy() {
  const now = kolkataParts(new Date());
  return `${String(now.day).padStart(2, "0")}-${String(now.month).padStart(2, "0")}-${now.year}`;
}

function kolkataParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { year: read("year"), month: read("month"), day: read("day") };
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

function moneyTick(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value));
}

function lineOf(values: number[], max: number, width: number, height: number, padLeft: number, padTop: number) {
  return values
    .map((value, index) => {
      const point = pointAt(value, index, values.length, max, width, height, padLeft, padTop);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function dotsOf(values: number[], max: number, width: number, height: number, padLeft: number, padTop: number) {
  const last = values.length - 1;
  return values.flatMap((value, index) => {
    if (values.length > 40 && index !== 0 && index !== last && index % 4 !== 0) return [];
    return [pointAt(value, index, values.length, max, width, height, padLeft, padTop)];
  });
}

function pointAt(value: number, index: number, count: number, max: number, width: number, height: number, padLeft: number, padTop: number) {
  const x = padLeft + (count === 1 ? width / 2 : (index / (count - 1)) * width);
  const y = padTop + height - (Math.max(0, value) / max) * (height - 8) - 4;
  return { x, y };
}
