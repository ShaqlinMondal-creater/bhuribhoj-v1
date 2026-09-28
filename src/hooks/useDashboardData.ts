"use client";

import { useCollection, useCollectionQuery } from "@/hooks/useCollection";
import { hasFullAccess } from "@/auth/authConfig";
import type { AuthenticatedUser } from "@/auth/authTypes";
import type { Mess } from "@/types/mess";
import type { Settings } from "@/types/settings";
import type {
  ExpensesSummary,
  GuestMealsSummary,
  MealsSummary,
  UsersSummary,
} from "@/data/collections";
import { getTodayDate } from "@/lib/dates";

// WHAT THE APP LOADS, AND WHEN.
//
// Opening the app fetches two things and nothing else:
//
//   mess      the sidebar and the page heading show the mess name and month
//   settings  the theme, and the guest thali prices a guest meal is priced from
//
// Both are single small documents. Everything else is asked for by the view that
// shows it, and the dashboard takes only totals rather than records: it needs
// counts and a handful of figures, not the collections behind them.

const noUsers: UsersSummary = { total: 0, active: 0, entryFeePending: 0 };
const noMeals: MealsSummary = { total: 0, todayAll: 0, todayLunch: 0, todayDinner: 0, recent: [] };
const noGuestMeals: GuestMealsSummary = { total: 0 };
const noExpenses: ExpensesSummary = { total: 0, fixed: 0, market: 0 };

/** The two documents the shell chrome itself needs, read once per session. */
export const useShellData = () => {
  const mess = useCollection<Mess>("mess");
  const settings = useCollection<Settings>("settings");
  const failed = mess.status === "error" || settings.status === "error";
  const ready = mess.status === "ready" && settings.status === "ready";

  return {
    mess: mess.data,
    settings: settings.data,
    status: ready ? ("ready" as const) : failed ? ("error" as const) : ("loading" as const),
    error: mess.error || settings.error,
  };
};

export type DashboardSummary = {
  meals: MealsSummary;
  guestMeals: GuestMealsSummary;
  expenses: ExpensesSummary;
  users: UsersSummary;
  loading: boolean;
  error: string;
};

/**
 * The dashboard's numbers, as four small summary requests.
 *
 * Nothing here is a collection: each endpoint answers with the handful of totals
 * the cards show. A member's own meals and guest meals are asked for scoped to
 * their member_id, so a member never receives anybody else's records, and they
 * never trigger a users request at all. `enabled` is false while another view is
 * open, so the dashboard asks again - fresh - the moment it comes back.
 */
export const useDashboardSummary = (
  user: AuthenticatedUser,
  enabled = true,
): DashboardSummary => {
  const fullAccess = hasFullAccess(user.role);
  const memberId = user.member_id ?? undefined;
  const today = getTodayDate();
  const scope = fullAccess ? {} : { memberId };

  const meals = useCollectionQuery<MealsSummary>("meals", { summary: "dashboard", today, ...scope }, enabled);
  const guestMeals = useCollectionQuery<GuestMealsSummary>("guestMeals", { summary: "dashboard", ...scope }, enabled);
  const expenses = useCollectionQuery<ExpensesSummary>("expenses", { summary: "dashboard" }, enabled);
  // Only a full-access role is shown user counts, so only they ask for them.
  const users = useCollectionQuery<UsersSummary>("users", { summary: "counts" }, enabled && fullAccess);

  return {
    meals: meals.data ?? noMeals,
    guestMeals: guestMeals.data ?? noGuestMeals,
    expenses: expenses.data ?? noExpenses,
    users: users.data ?? noUsers,
    loading: [meals, guestMeals, expenses, users].some((result) => result.status === "loading"),
    error: [meals, guestMeals, expenses, users]
      .map((result) => result.error)
      .filter(Boolean)
      .join(" "),
  };
};
